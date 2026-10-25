'use client';
import {createContext,useContext,type ReactNode} from 'react';
import type {HomepageConfig,HomeCopyKey,HomeSection} from '@/src/lib/homepageContent';
const Context=createContext<HomepageConfig|null>(null);
export function HomepageContentProvider({value,children}:{value:HomepageConfig|null;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>;}
export function HomeText({name,children}:{name:HomeCopyKey;children:ReactNode}){return useContext(Context)?.copy[name]||children;}
export function HomeSectionVisibility({name,children}:{name:HomeSection;children:ReactNode}){return useContext(Context)?.hiddenSections.includes(name)?null:children;}
