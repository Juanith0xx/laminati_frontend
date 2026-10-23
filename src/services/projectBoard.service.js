import { apiRequest } from "@/services/api";

const qs=(params={})=>{
  const s=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{
    if(v!==undefined&&v!==null&&String(v).trim()!=="") s.set(k,String(v));
  });
  const value=s.toString();
  return value?`?${value}`:"";
};

export const getProjectBoard=(filters={})=>apiRequest(`/admin/project-board${qs(filters)}`);
export const getProjectBoardDetail=(id)=>apiRequest(`/admin/project-board/${encodeURIComponent(id)}`);
export const updateProjectBoard=(id,body)=>apiRequest(`/admin/project-board/${encodeURIComponent(id)}`,{method:"PATCH",body});
export const addProjectBoardNote=(id,note)=>apiRequest(`/admin/project-board/${encodeURIComponent(id)}/notes`,{method:"POST",body:{note}});
export const createProjectFollowup=(id,body)=>apiRequest(`/admin/project-board/${encodeURIComponent(id)}/followups`,{method:"POST",body});
export const updateProjectFollowup=(id,followupId,body)=>apiRequest(`/admin/project-board/${encodeURIComponent(id)}/followups/${encodeURIComponent(followupId)}`,{method:"PATCH",body});
export const getProjectBoardCalendar=({from,to})=>apiRequest(`/admin/project-board/calendar${qs({from,to})}`);
export const getProjectBoardUsers=()=>apiRequest("/admin/project-board/users");
