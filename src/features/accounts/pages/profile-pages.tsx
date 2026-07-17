import { useEffect, useState } from "react"
import { accountsApi } from "../api"
import type { Actor } from "../types"
import { PageHeader, ErrorBox, Loading } from "../components"
import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Building2, KeyRound, Mail, Pencil, Phone, ShieldCheck, UserRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfilePage(){
  const [a,setA]=useState<Actor|null>(null)
  const [e,setE]=useState('')

  useEffect(()=>{accountsApi.profile().then(setA).catch(x=>setE(getApiErrorMessage(x)))},[])

  if(e)return <ErrorBox message={e}/>
  if(!a)return <Loading/>

  const initials = `${a.first_name?.[0] ?? ''}${a.last_name?.[0] ?? ''}`.toUpperCase() || a.username.slice(0,2).toUpperCase()
  const details = [
    { label:'Identifiant', value:a.username, icon:UserRound },
    { label:'Adresse e-mail', value:a.email, icon:Mail },
    { label:'Téléphone', value:a.telephone||'Non renseigné', icon:Phone },
    { label:'Titre', value:a.titre||'Non renseigné', icon:ShieldCheck },
    { label:'Organisation', value:a.organisation||'Non renseignée', icon:Building2 },
    { label:'Statut', value:a.statut, icon:ShieldCheck },
  ]

  return <>
    <PageHeader title="Mon profil" description="Vos informations personnelles et professionnelles."/>

    <Card className="mb-6 border-primary/15 bg-gradient-to-r from-primary/8 via-background to-background">
      <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Compte acteur</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{a.nom_complet}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.titre||'Titre non renseigné'}{a.organisation ? ` · ${a.organisation}` : ''}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-11 px-5 text-sm" render={<Link to="/app/profil/modifier"/>}>
            <Pencil className="size-4"/>
            Modifier mon profil
          </Button>
          <Button size="lg" className="h-11 px-5 text-sm" render={<Link to="/app/profil/mot-de-passe"/>} variant="outline">
            <KeyRound className="size-4"/>
            Changer mon mot de passe
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 lg:p-7">
        {details.map(({label,value,icon:Icon})=><div key={label} className="flex min-h-24 items-start gap-4 rounded-xl border bg-background p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5"/>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 break-words text-base font-semibold capitalize">{value}</p>
          </div>
        </div>)}
      </CardContent>
    </Card>
  </>
}
export function EditProfilePage(){ const [form,setForm]=useState({first_name:'',last_name:'',telephone:'',titre:'',organisation:''}); const [msg,setMsg]=useState(''); const [err,setErr]=useState(''); useEffect(()=>{accountsApi.profile().then(a=>setForm({first_name:a.first_name,last_name:a.last_name,telephone:a.telephone||'',titre:a.titre,organisation:a.organisation}))},[]); const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v})); async function submit(e:React.FormEvent){e.preventDefault();setErr('');try{await accountsApi.updateProfile(form);setMsg('Profil modifié avec succès.')}catch(x){setErr(getApiErrorMessage(x))}} return <><PageHeader title="Modifier mon profil" backTo="/app/profil"/><Card><CardContent className="p-7"><form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">{[['first_name','Prénom'],['last_name','Nom'],['telephone','Téléphone'],['titre','Titre'],['organisation','Organisation']].map(([k,l])=><div key={k} className="space-y-2"><Label>{l}</Label><Input value={form[k as keyof typeof form]} onChange={e=>set(k,e.target.value)}/></div>)}<div className="sm:col-span-2">{err&&<ErrorBox message={err}/>} {msg&&<p className="mb-4 text-sm text-primary">{msg}</p>}<Button type="submit">Enregistrer</Button></div></form></CardContent></Card></> }
export function ChangePasswordPage(){ const [f,setF]=useState({ancien_mot_de_passe:'',nouveau_mot_de_passe:'',confirmation_mot_de_passe:''});const [m,setM]=useState('');const [e,setE]=useState(''); async function submit(x:React.FormEvent){x.preventDefault();setE('');try{await accountsApi.changePassword(f);setM('Mot de passe modifié avec succès.');setF({ancien_mot_de_passe:'',nouveau_mot_de_passe:'',confirmation_mot_de_passe:''})}catch(y){setE(getApiErrorMessage(y))}} return <><PageHeader title="Changer mon mot de passe"/><Card><CardContent className="max-w-2xl p-7"><form onSubmit={submit} className="space-y-5">{[['ancien_mot_de_passe','Ancien mot de passe'],['nouveau_mot_de_passe','Nouveau mot de passe'],['confirmation_mot_de_passe','Confirmer le mot de passe']].map(([k,l])=><div key={k} className="space-y-2"><Label>{l}</Label><Input type="password" value={f[k as keyof typeof f]} onChange={z=>setF(v=>({...v,[k]:z.target.value}))}/></div>)}{e&&<ErrorBox message={e}/>} {m&&<p className="text-sm text-primary">{m}</p>}<Button type="submit">Modifier le mot de passe</Button></form></CardContent></Card></> }
