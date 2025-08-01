'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser } from "@/lib/auth"
import type { User } from '@/lib/types';

export function UserNav() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  if (!currentUser) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="flex items-center gap-3">
       <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar} alt={`@${currentUser.name}`} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
        </Avatar>
        <div className="text-sm text-left">
            <p className="font-semibold ">{currentUser.role === 'master' ? 'Master Administrator' : currentUser.name}</p>
            <p className="text-muted-foreground">{currentUser.role === 'master' ? 'Master Admin' : 'Client'}</p>
        </div>
    </div>
  )
}
