import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Agregar logs para debug
    console.log('🔍 URL:', req.url);
    console.log('🔍 PATH:', req.path);

    // Rutas públicas que no requieren validación de tenant
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/me',
      '/auth/change-password',
      '/health',
    ];

    // Verificar si la URL contiene alguna de las rutas públicas
    const isPublicRoute = publicRoutes.some(route => 
      req.url.includes(route)
    );

    console.log('🔍 IS PUBLIC:', isPublicRoute);

    if (isPublicRoute) {
      console.log('✅ PUBLIC ROUTE - Skipping tenant validation');
      return next();
    }

    const tenantId = req.headers['x-tenant-id'] as string;

    console.log('🔍 TENANT ID:', tenantId);

    if (!tenantId) {
      throw new BadRequestException(
        'x-tenant-id header is required',
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Inyectamos el tenantId en el request
    (req as any).tenantId = tenantId;

    next();
  }
}
