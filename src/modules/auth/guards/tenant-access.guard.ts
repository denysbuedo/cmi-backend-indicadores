import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] || request.params.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID requerido');
    }

    // SUPER_ADMIN tiene acceso a todos los tenants
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Verificar si el usuario tiene acceso al tenant
    const hasAccess = user.tenants?.some((t) => t.tenantId === tenantId);

    if (!hasAccess) {
      throw new ForbiddenException('No tiene acceso a este tenant');
    }

    return true;
  }
}
