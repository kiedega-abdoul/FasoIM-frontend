import { httpClient } from "@/api/http-client"
import type { Actor, ActorAssignment, Delegation, DirectPermission, ListResponse, Permission, PermissionRequest, Role, RoleAssignment, RolePermission, AssignmentReferences } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results
export const accountsApi = {
  async actors(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<Actor>>("/accounts/acteurs/",{params}); return list(r.data) },
  async actor(id:number){ return (await httpClient.get<Actor>(`/accounts/acteurs/${id}/`)).data },
  async createActor(data:Partial<Actor>){ return (await httpClient.post<Actor>("/accounts/acteurs/",data)).data },
  async updateActor(id:number,data:Partial<Actor>){ return (await httpClient.patch<Actor>(`/accounts/acteurs/${id}/`,data)).data },
  async disableActor(id:number){ return (await httpClient.post(`/accounts/acteurs/${id}/desactiver/`)).data },
  async enableActor(id:number){ return (await httpClient.post(`/accounts/acteurs/${id}/reactiver/`)).data },
  async profile(){ return (await httpClient.get<Actor>("/accounts/acteurs/me/")).data },
  async updateProfile(data:Partial<Actor>){ return (await httpClient.patch<Actor>("/accounts/acteurs/mon_profil/",data)).data },
  async changePassword(data:{ancien_mot_de_passe:string;nouveau_mot_de_passe:string;confirmation_mot_de_passe:string}){ return (await httpClient.post("/accounts/acteurs/changer_mot_de_passe/",data)).data },

  async roles(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<Role>>("/accounts/roles/",{params}); return list(r.data) },
  async role(id:number){ return (await httpClient.get<Role>(`/accounts/roles/${id}/`)).data },
  async createRole(data:Partial<Role>){ return (await httpClient.post<Role>("/accounts/roles/",data)).data },
  async updateRole(id:number,data:Partial<Role>){ return (await httpClient.patch<Role>(`/accounts/roles/${id}/`,data)).data },
  async disableRole(id:number){ return (await httpClient.post(`/accounts/roles/${id}/desactiver/`)).data },

  async permissions(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<Permission>>("/accounts/permissions/",{params}); return list(r.data) },
  async permission(id:number){ return (await httpClient.get<Permission>(`/accounts/permissions/${id}/`)).data },
  async permissionModules(){ return (await httpClient.get<{modules:string[]}>("/accounts/permissions/modules/")).data.modules },

  async assignments(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<ActorAssignment>>("/accounts/affectations-acteurs/",{params}); return list(r.data) },
  async assignment(id:number){ return (await httpClient.get<ActorAssignment>(`/accounts/affectations-acteurs/${id}/`)).data },
  async createAssignment(data:Record<string,unknown>){ return (await httpClient.post<ActorAssignment>("/accounts/affectations-acteurs/",data)).data },
  async assignmentReferences(params?:{region_code?:string}){ return (await httpClient.get<AssignmentReferences>("/accounts/affectations-acteurs/references/",{params})).data },
  async removeAssignment(id:number){ return (await httpClient.post(`/accounts/affectations-acteurs/${id}/retirer/`)).data },
  async suspendAssignment(id:number){ return (await httpClient.post(`/accounts/affectations-acteurs/${id}/suspendre/`)).data },
  async enableAssignment(id:number){ return (await httpClient.post(`/accounts/affectations-acteurs/${id}/reactiver/`)).data },

  async roleAssignments(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<RoleAssignment>>("/accounts/affectation-roles/",{params}); return list(r.data) },
  async createRoleAssignment(data:Record<string,unknown>){ return (await httpClient.post<RoleAssignment>("/accounts/affectation-roles/",data)).data },
  async removeRoleAssignment(id:number){ await httpClient.post(`/accounts/affectation-roles/${id}/retirer/`) },

  async rolePermissions(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<RolePermission>>("/accounts/role-permissions/",{params}); return list(r.data) },
  async addRolePermission(data:Record<string,unknown>){ return (await httpClient.post<RolePermission>("/accounts/role-permissions/",data)).data },
  async removeRolePermission(id:number){ await httpClient.post(`/accounts/role-permissions/${id}/retirer/`) },

  async directPermissions(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<DirectPermission>>("/accounts/affectation-permissions/",{params}); return list(r.data) },
  async addDirectPermission(data:Record<string,unknown>){ return (await httpClient.post<DirectPermission>("/accounts/affectation-permissions/",data)).data },
  async removeDirectPermission(id:number){ await httpClient.post(`/accounts/affectation-permissions/${id}/retirer/`) },

  async permissionRequests(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<PermissionRequest>>("/accounts/demandes-permissions/",{params}); return list(r.data) },
  async permissionRequest(id:number){ return (await httpClient.get<PermissionRequest>(`/accounts/demandes-permissions/${id}/`)).data },
  async createPermissionRequest(data:Record<string,unknown>){ return (await httpClient.post<PermissionRequest>("/accounts/demandes-permissions/",data)).data },
  async approvePermissionRequest(id:number,data:Record<string,unknown>){ return (await httpClient.post<PermissionRequest>(`/accounts/demandes-permissions/${id}/approuver/`,data)).data },
  async rejectPermissionRequest(id:number,data:Record<string,unknown>){ return (await httpClient.post<PermissionRequest>(`/accounts/demandes-permissions/${id}/refuser/`,data)).data },

  async delegations(params?:Record<string,string|number|undefined>){ const r=await httpClient.get<ListResponse<Delegation>>("/accounts/delegations-acteurs/",{params}); return list(r.data) },
  async delegation(id:number){ return (await httpClient.get<Delegation>(`/accounts/delegations-acteurs/${id}/`)).data },
  async createDelegation(data:Record<string,unknown>){ return (await httpClient.post<Delegation>("/accounts/delegations-acteurs/",data)).data },
  async endDelegation(id:number){ return (await httpClient.post<Delegation>(`/accounts/delegations-acteurs/${id}/terminer/`)).data },
}
