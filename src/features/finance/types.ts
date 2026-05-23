import type { components } from '@/types/openapi';

export type Cost = components['schemas']['ResCostDTO'];
export type CostTag = components['schemas']['ResCostTagDTO'];
export type ReqCreateCostDTO = components['schemas']['ReqCreateCostDTO'];
export type ReqUpdateCostDTO = components['schemas']['ReqUpdateCostDTO'];
export type ReqCreateCostTagDTO = components['schemas']['ReqCreateCostTagDTO'];
export type ReqUpdateCostTagDTO = components['schemas']['ReqUpdateCostTagDTO'];
export type CostPaidStatus = NonNullable<Cost['cost_paid_status']>;

