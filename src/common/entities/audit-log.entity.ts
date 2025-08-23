import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  UPLOAD = 'upload',
  EXPORT = 'export',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty({ description: 'Audit log unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  @Column({ nullable: true })
  userId: string;

  @ApiProperty({ description: 'User email who performed the action' })
  @Column({ nullable: true })
  userEmail: string;

  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({ description: 'Resource type affected' })
  @Column()
  resource: string;

  @ApiProperty({ description: 'Resource ID affected' })
  @Column({ nullable: true })
  resourceId: string;

  @ApiProperty({ enum: AuditStatus, description: 'Action status' })
  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
  })
  status: AuditStatus;

  @ApiProperty({ description: 'IP address of the request' })
  @Column({ nullable: true })
  ipAddress: string;

  @ApiProperty({ description: 'User agent of the request' })
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @ApiProperty({ description: 'Request endpoint' })
  @Column({ nullable: true })
  endpoint: string;

  @ApiProperty({ description: 'HTTP method used' })
  @Column({ nullable: true })
  httpMethod: string;

  @ApiProperty({ description: 'Response status code' })
  @Column({ nullable: true })
  statusCode: number;

  @ApiProperty({ description: 'Request processing time in ms' })
  @Column({ nullable: true })
  processingTime: number;

  @ApiProperty({ description: 'Error message if action failed' })
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ApiProperty({ description: 'Additional context or metadata' })
  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ApiProperty({ description: 'Changes made (before/after)' })
  @Column({ type: 'json', nullable: true })
  changes: any;

  @ApiProperty({ description: 'Audit log creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
