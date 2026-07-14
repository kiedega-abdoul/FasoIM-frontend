import { Fingerprint, KeyRound, MapPin, Shield, UserCog, Users, UserRoundCog } from "lucide-react"
import { ACCOUNT_PERMISSIONS as P } from "./permissions"
export type AccountNavItem={label:string;href:string;permission:string;icon:typeof Users;end?:boolean}
export const accountNavigation:AccountNavItem[]=[
 {label:'Acteurs',href:'/app/acteurs',permission:P.LIST_ACTORS,icon:Users},
 {label:'Créer un acteur',href:'/app/acteurs/nouveau',permission:P.CREATE_ACTOR,icon:UserRoundCog},
 {label:'Affectations acteurs',href:'/app/affectations-acteurs',permission:P.LIST_ACTORS,icon:MapPin},
 {label:'Rôles',href:'/app/roles',permission:P.LIST_ROLES,icon:Shield},
 {label:'Attributions de rôles',href:'/app/attributions-roles',permission:P.VIEW_ACTOR,icon:UserCog},
 {label:'Permissions',href:'/app/permissions',permission:P.LIST_PERMISSIONS,icon:KeyRound},
 {label:'Permissions directes',href:'/app/permissions-directes',permission:P.VIEW_PERMISSION,icon:Fingerprint},
 {label:'Demandes de permissions',href:'/app/demandes-permissions',permission:P.LIST_PERMISSION_REQUESTS,icon:KeyRound},
 {label:'Nouvelle demande',href:'/app/demandes-permissions/nouvelle',permission:P.REQUEST_PERMISSION,icon:KeyRound},
 {label:'Délégations',href:'/app/delegations',permission:P.LIST_DELEGATIONS,icon:UserCog},
]
