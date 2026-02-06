import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    const mockReflector = {
        getAllAndOverride: jest.fn(),
    };

    const createMockContext = (user: any, handler?: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                }),
            }),
            getHandler: () => handler || (() => {}),
            getClass: () => class {},
        } as ExecutionContext;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesGuard,
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
            ],
        }).compile();

        guard = module.get<RolesGuard>(RolesGuard);
        reflector = module.get<Reflector>(Reflector);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow access when no roles are specified', () => {
        mockReflector.getAllAndOverride.mockReturnValue(undefined);
        const context = createMockContext({ role: UserRole.FREE });

        const result = guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
        mockReflector.getAllAndOverride.mockReturnValue([UserRole.PREMIUM, UserRole.ADMIN]);
        const context = createMockContext({ role: UserRole.PREMIUM });

        const result = guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should allow access when user has ADMIN role for PREMIUM endpoint', () => {
        mockReflector.getAllAndOverride.mockReturnValue([UserRole.PREMIUM]);
        const context = createMockContext({ role: UserRole.ADMIN });

        const result = guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
        mockReflector.getAllAndOverride.mockReturnValue([UserRole.PREMIUM, UserRole.ADMIN]);
        const context = createMockContext({ role: UserRole.FREE });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
            expect.objectContaining({
                message: expect.stringContaining('Access denied'),
            }),
        );
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
        mockReflector.getAllAndOverride.mockReturnValue([UserRole.PREMIUM]);
        const context = createMockContext(null);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should check multiple roles correctly', () => {
        mockReflector.getAllAndOverride.mockReturnValue([UserRole.FREE, UserRole.PREMIUM]);
        const context = createMockContext({ role: UserRole.FREE });

        const result = guard.canActivate(context);
        expect(result).toBe(true);
    });
});

