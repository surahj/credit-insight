import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../entities';

export interface CurrentUserData {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
