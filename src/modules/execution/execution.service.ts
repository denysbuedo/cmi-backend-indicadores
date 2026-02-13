import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ExecutionService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
  ) {}

  async executeIndicator(tenantId: string, indicatorId: string) {
    const indicator = await this.prisma.indicator.findFirst({
      where: { id: indicatorId, tenantId },
      include: {
        sources: {
          include: {
            source: true,
          },
        },
      },
    });

    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }

    let numerator: number | null = null;
    let denominator: number | null = null;
    let directValue: number | null = null;

    for (const link of indicator.sources) {
      const source = link.source;

      // 🔹 Headers tipados correctamente
      const headers =
        source.headers && typeof source.headers === 'object'
          ? (source.headers as Record<string, string>)
          : undefined;

      const response = await lastValueFrom(
        this.http.request({
          url: source.endpoint,
          method: source.method as any,
          headers,
          timeout: source.timeout,
        }),
      );

      const value = Number(response.data);

      if (isNaN(value)) {
        throw new Error(
          `Source ${source.name} did not return a numeric value`,
        );
      }

      if (link.role === 'DATA') {
        directValue = value;
      }

      if (link.role === 'NUMERATOR') {
        numerator = value;
      }

      if (link.role === 'DENOMINATOR') {
        denominator = value;
      }
    }

    let finalValue: number;

    if (directValue !== null) {
      finalValue = directValue;
    } else if (numerator !== null && denominator !== null) {
      if (denominator === 0) {
        throw new Error('Denominator returned 0');
      }
      finalValue = numerator / denominator;
    } else {
      throw new Error('Invalid source configuration');
    }

    const now = new Date();

    return this.prisma.indicatorValue.create({
      data: {
        indicatorId,
        tenantId,
        value: finalValue,
        periodStart: now,
        periodEnd: now,
      },
    });
  }
}
