import { User } from 'firebase/auth';

/**
 * Utility functions to get the user's profile picture consistently across the app
 */

/**
 * Get the profile picture URL for a user
 * Checks in order: profilePic > photoURL > fallback placeholder
 */
export function getUserProfilePic(
  userProfilePic?: string,
  photoURL?: string,
  fallback: string = ""
): string {
  return userProfilePic || photoURL || fallback;
}

/**
 * Get the current user's profile picture from various sources
 * Used in pages and components to display user's own profile pic
 */
export function getCurrentUserProfilePic(
  currentUser: User | null,
  userProfile?: {
    profilePic?: string;
    photoURL?: string;
  } | null,
  fallback: string = ""
): string {
  if (!currentUser) return fallback;
  
  // Priority: profilePic > photoURL > fallback
  return (
    userProfile?.profilePic ||
    userProfile?.photoURL ||
    currentUser.photoURL ||
    fallback
  );
}

/**
 * Get avatar fallback - first letter of display name
 */
export function getAvatarFallback(displayName?: string | null): string {
  if (!displayName) return "U";
  return displayName.charAt(0).toUpperCase();
}
