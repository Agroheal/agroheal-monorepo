import React, { useState } from "react";

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const cleanEmail = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
    if (cleanEmail.length >= 2) {
      return cleanEmail.slice(0, 2).toUpperCase();
    }
    return cleanEmail.slice(0, 1).toUpperCase() || "U";
  }
  return "U";
}

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  email,
  className = "",
  sizeClassName = "w-10 h-10",
  textClassName = "text-xs font-black",
  roundedClassName = "rounded-full",
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name, email);

  // If user uploaded a photo and it loads successfully
  if (src && !imgError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md ring-2 ring-emerald-400/40 select-none ${sizeClassName} ${className}`}
      >
        <img
          src={src}
          alt={name || "User Avatar"}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // High-contrast, elegant light background that pops out against dark green surfaces
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-white via-emerald-50 to-emerald-100 text-emerald-950 font-black tracking-wide border-2 border-white shadow-md ring-2 ring-emerald-400/40 select-none ${sizeClassName} ${textClassName} ${className}`}
      title={name || email || "User"}
    >
      <span className="drop-shadow-xs">{initials}</span>
    </div>
  );
};

export default UserAvatar;
