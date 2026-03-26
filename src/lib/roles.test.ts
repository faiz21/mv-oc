import { describe, expect, it } from 'vitest'
import {
  canAccessAdminSurface,
  canReviewOperations,
  getRoleLabel,
  normalizeRole,
  toWorkflowApproverRole,
} from './roles'

describe('role helpers', () => {
  it('normalizes legacy and canonical roles to the shared model', () => {
    expect(normalizeRole('admin')).toBe('admin')
    expect(normalizeRole('director')).toBe('director')
    expect(normalizeRole('officer')).toBe('officer')
    expect(normalizeRole('operator')).toBe('officer')
    expect(normalizeRole('member')).toBe('member')
    expect(normalizeRole('viewer')).toBe('member')
    expect(normalizeRole('something-else')).toBe('member')
    expect(normalizeRole(null)).toBe('member')
  })

  it('derives labels and access flags from normalized roles', () => {
    expect(getRoleLabel('admin')).toBe('Admin')
    expect(getRoleLabel('director')).toBe('Director')
    expect(getRoleLabel('operator')).toBe('Officer')
    expect(getRoleLabel('viewer')).toBe('Member')
    expect(canAccessAdminSurface('admin')).toBe(true)
    expect(canAccessAdminSurface('director')).toBe(false)
    expect(canReviewOperations('officer')).toBe(true)
    expect(canReviewOperations('operator')).toBe(true)
    expect(canReviewOperations('viewer')).toBe(false)
  })

  it('maps canonical roles back to current workflow approver literals', () => {
    expect(toWorkflowApproverRole('admin')).toBe('admin')
    expect(toWorkflowApproverRole('director')).toBe('operator')
    expect(toWorkflowApproverRole('officer')).toBe('operator')
    expect(toWorkflowApproverRole('member')).toBe('operator')
  })
})
