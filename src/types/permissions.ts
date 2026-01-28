/**
 * Types for permission system
 * 
 * Step 6: Type safety for backend permission names
 * Canonical source: Backend app/core/permissions_map.py
 */

/**
 * Backend permission names (snake_case)
 * CRITICAL: Must match exactly with app/core/permissions_map.py
 */
export type BackendPermission =
  // Athletes
  | 'can_view_athletes'
  | 'can_create_athletes'
  | 'can_edit_athletes'
  | 'can_delete_athletes'
  
  // Teams  
  | 'can_view_teams'
  | 'can_create_teams'
  | 'can_manage_teams'  // Note: PLURAL (not can_manage_team)
  | 'can_delete_teams'
  
  // Team Members
  | 'can_view_members'
  | 'can_manage_members'
  
  // Training
  | 'can_view_training'
  | 'can_create_training'
  | 'can_edit_training'
  | 'can_delete_training'
  
  // Matches
  | 'can_view_matches'
  | 'can_create_matches'
  | 'can_edit_matches'
  | 'can_delete_matches'
  
  // Wellness
  | 'can_view_wellness'
  | 'can_edit_wellness'
  
  // Medical
  | 'can_view_medical'
  | 'can_edit_medical'
  
  // Organization
  | 'can_manage_organization'
  | 'can_manage_seasons'
  
  // System
  | 'can_view_reports'
  | 'can_view_dashboard'
  | 'can_manage_system';

/**
 * Permission map type returned by backend
 * Format: { "can_view_teams": true, "can_manage_teams": false, ... }
 */
export type PermissionsMap = Record<BackendPermission, boolean>;

/**
 * Partial permissions (user may not have all permissions)
 */
export type UserPermissions = Partial<PermissionsMap>;
