import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"

export function PermissionGuard({permission,children,fallback=null}:{permission:string;children:ReactNode;fallback?:ReactNode}){ const ok=useAuthStore(s=>s.context?.affectation_courante?.permissions.includes(permission) ?? false); return ok ? <>{children}</> : <>{fallback}</> }
export function StatusBadge({value}:{value:string}){ const good=['actif','active','approuvee','approuve','en_cours']; return <Badge variant={good.includes(value) ? 'default':'secondary'} className="capitalize">{value.replaceAll('_',' ')}</Badge> }
export function PageHeader({title,description,backTo,actionTo,actionLabel,actionPermission}:{title:string;description?:string;backTo?:string;actionTo?:string;actionLabel?:string;actionPermission?:string}){ return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{backTo&&<Button render={<Link to={backTo}/>} variant="ghost" className="mb-3 gap-2 px-0"><ArrowLeft className="size-4"/>Retour</Button>}<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description&&<p className="mt-2 max-w-3xl text-base text-muted-foreground">{description}</p>}</div>{actionTo&&(!actionPermission||useAuthStore.getState().context?.affectation_courante?.permissions.includes(actionPermission))&&<Button render={<Link to={actionTo}/>} className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold"><Plus className="size-5"/>{actionLabel}</Button>}</div> }
export function EmptyState({message}:{message:string}){ return <Card><CardContent className="p-10 text-center text-muted-foreground">{message}</CardContent></Card> }
export function Loading(){ return <Card><CardContent className="p-10 text-center text-muted-foreground">Chargement…</CardContent></Card> }
export function ErrorBox({message}:{message:string}){ return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message}</div> }
