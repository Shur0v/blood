"use client";

import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type Navbar from './Navbar';

type Navigation = ComponentProps<typeof Navbar>;
type Registration = { owner: symbol; navigation: Navigation };
const NavigationState = createContext<Navigation | null>(null);
const NavigationRegistration = createContext<((entry: Registration) => () => void) | null>(null);

export function SiteNavigationProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<Registration | null>(null);
  const register = useCallback((next: Registration) => {
    setEntry(next);
    return () => setEntry(current => current?.owner === next.owner ? null : current);
  }, []);
  return <NavigationRegistration.Provider value={register}>
    <NavigationState.Provider value={entry?.navigation ?? null}>{children}</NavigationState.Provider>
  </NavigationRegistration.Provider>;
}

export const useSiteNavigation = () => useContext(NavigationState);

// The homepage keeps its existing local page/auth actions; only the menu's
// mounting point moves to the root, outside page transforms and overflow.
export function HomeNavigationRegistration(props: Navigation) {
  const register = useContext(NavigationRegistration);
  const latest = useRef(props);
  const owner = useRef(Symbol('home-navigation'));
  useLayoutEffect(() => { latest.current = props; });
  useLayoutEffect(() => register?.({
    owner: owner.current,
    navigation: {
      currentPage: props.currentPage,
      isLoggedIn: props.isLoggedIn,
      onPageChange: page => latest.current.onPageChange(page),
      onHomeClick: () => latest.current.onHomeClick(),
      onAuthClick: () => latest.current.onAuthClick(),
    },
  }), [register, props.currentPage, props.isLoggedIn]);
  return null;
}
