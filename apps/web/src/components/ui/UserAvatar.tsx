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
  textClassName = "text-xs font-bold",
  roundedClassName = "rounded-full",
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name, email);

  if (src && !imgError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden shadow-xs border border-emerald-500/30 ${sizeClassName} ${roundedClassName} ${className}`}
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

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 text-white tracking-wider border border-emerald-400/40 shadow-xs select-none ${sizeClassName} ${roundedClassName} ${textClassName} ${className}`}
      title={name || email || "User"}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
