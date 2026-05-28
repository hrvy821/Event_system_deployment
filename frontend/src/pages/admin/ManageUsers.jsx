import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Trash2, Edit3, UserPlus, Shield, User, X, 
  Search, Filter, CheckCircle2, AlertTriangle, Calendar 
} from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const [editModal, setEditModal] = useState({ show: false, user: null });
  const [addUserModal, setAddUserModal] = useState(false);
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });
  const [confirmArchive, setConfirmArchive] = useState({ show: false, userId: null, userName: '', isBulk: false });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Organizer' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users'); 
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Legacy Account';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/admin', newUser);
      setAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'Organizer' }); 
      fetchUsers(); 
      setModal({ show: true, type: 'success', title: 'User Created', message: 'The new team member has been successfully added.' });
    } catch (error) {
      const backendError = error.response?.data?.message || 'Cannot connect to server.';
      const errorMessage = Array.isArray(backendError) ? backendError[0] : backendError;
      setModal({ show: true, type: 'error', title: 'Backend Error', message: errorMessage });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: editModal.user.name, email: editModal.user.email };
      if (editModal.user.password && editModal.user.password.trim() !== '') {
        payload.password = editModal.user.password;
      }
      await api.put(`/users/${editModal.user.id}`, payload);
      
      fetchUsers(); 
      setEditModal({ show: false, user: null });
      setModal({ show: true, type: 'success', title: 'Updated', message: 'User details updated successfully.' });
    } catch (error) {
      const backendError = error.response?.data?.message || 'Cannot connect to server.';
      const errorMessage = Array.isArray(backendError) ? backendError[0] : backendError;
      setModal({ show: true, type: 'error', title: 'Backend Error', message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) });
    }
  };

  const executeArchive = async () => {
    setConfirmArchive({ ...confirmArchive, show: false }); 
    try {
      if (confirmArchive.isBulk) {
        await Promise.all(selectedUsers.map(id => api.patch(`/auth/users/${id}/archive`)));
        setUsers(users.map(u => selectedUsers.includes(u.id) ? { ...u, isArchived: true } : u));
        setSelectedUsers([]);
        setModal({ show: true, type: 'success', title: 'Bulk Archive', message: `${selectedUsers.length} users have been archived.` });
      } else {
        await api.patch(`/auth/users/${confirmArchive.userId}/archive`); 
        setUsers(users.map(u => u.id === confirmArchive.userId ? { ...u, isArchived: true } : u));
        setModal({ show: true, type: 'success', title: 'Archived', message: `${confirmArchive.userName} has been archived.` });
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Archive Failed', message: 'An error occurred while archiving users.' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedUsers(filteredUsers.map(u => u.id));
    else setSelectedUsers([]);
  };

  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    else setSelectedUsers([...selectedUsers, id]);
  };

  // 🌟 FIX: Detect if the admin is typing "admin" in either the Add User or Edit User modals
  const isNewUserAdmin = newUser.email.trim().toLowerCase() === 'admin';
  const isEditUserAdmin = editModal.user?.email?.trim().toLowerCase() === 'admin';

  if (loading) return <div className="p-8 text-gray-500 animate-pulse font-medium text-lg">Loading users...</div>;

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Team</h1>
          <p className="text-gray-500 mt-1 font-medium">Add organizers, manage roles, and monitor team members.</p>
        </div>
        <button 
          onClick={() => setAddUserModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap active:scale-[0.98]"
        >
          <UserPlus size={20} strokeWidth={2.5} /> Add User
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
          />
        </div>
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select 
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold text-gray-700"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admins</option>
            <option value="Organizer">Organizers</option>
            <option value="Attendee">Attendees</option>
          </select>
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200/60 p-4 rounded-2xl mb-6 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white font-bold w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm">
              {selectedUsers.length}
            </span>
            <span className="font-bold text-indigo-900">Users Selected</span>
          </div>
          <button 
            onClick={() => setConfirmArchive({ show: true, isBulk: true })}
            className="text-red-600 bg-red-50 hover:text-white hover:bg-red-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Trash2 size={16} strokeWidth={2.5} /> Archive Selected
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="p-5 w-12 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" onChange={handleSelectAll} checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length} />
                </th>
                <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Role</th>
                <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="p-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((person) => (
                <tr key={person.id} className={`hover:bg-gray-50/50 transition-colors ${person.isArchived ? 'bg-gray-50/30' : 'bg-white'}`}>
                  <td className="p-5 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 cursor-pointer" checked={selectedUsers.includes(person.id)} onChange={() => handleSelectUser(person.id)} />
                  </td>
                  <td className="p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${person.isArchived ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className={`font-extrabold text-sm ${person.isArchived ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{person.name}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{person.email}</div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider shadow-sm ${
                      person.role === 'Admin' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200' :
                      person.role === 'Organizer' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    } ${person.isArchived ? 'opacity-50 grayscale' : ''}`}>
                      {person.role === 'Admin' && <Shield size={12} />}
                      {person.role}
                    </span>
                  </td>
                  <td className="p-5">
                    {person.isArchived ? (
                      <span className="flex items-center gap-2 text-gray-500 text-xs font-extrabold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span> Archived
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-600 text-xs font-extrabold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-sm text-gray-500 font-medium flex items-center gap-2 mt-3">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(person.createdAt)}
                  </td>
                  <td className="p-5 text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditModal({ show: true, user: { ...person, password: '' } })} className="text-slate-600 hover:text-blue-600 transition-colors p-2 bg-slate-50 hover:bg-blue-50 rounded-xl cursor-pointer" title="Edit User">
                        <Edit3 size={18} />
                      </button>
                      {person.role !== 'Admin' && (
                        <button 
                          onClick={() => setConfirmArchive({ show: true, userId: person.id, userName: person.name, isBulk: false })}
                          disabled={person.isArchived}
                          className={`transition-colors p-2 rounded-xl cursor-pointer ${
                            person.isArchived ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:text-white hover:bg-red-500'
                          }`}
                          title={person.isArchived ? "User Archived" : "Archive User"}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                 <tr>
                   <td colSpan="6" className="p-16 text-center text-gray-500">
                     <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Search size={32} className="text-gray-300" /></div>
                        <p className="font-extrabold text-gray-900 text-lg">No users found</p>
                        <p className="text-sm mt-1 font-medium">Try adjusting your search or role filter.</p>
                     </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {addUserModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 scale-100">
            <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2"><UserPlus size={20} className="text-blue-500"/> Add Team Member</h3>
              <button onClick={() => setAddUserModal(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors cursor-pointer"><X size={18} strokeWidth={2.5}/></button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" required autoComplete="off" placeholder="e.g. Jane Doe" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-900" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                {/* 🌟 FIX: Dynamic type attribute allows "admin" */}
                <input type={isNewUserAdmin ? "text" : "email"} required autoComplete="off" placeholder="e.g. jane@example.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-900" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                <input type="password" required autoComplete="new-password" placeholder="••••••••" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-900" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-bold text-gray-900 appearance-none cursor-pointer" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="Attendee">Attendee</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md mt-4 cursor-pointer active:scale-95">Create User</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 scale-100">
            <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2"><Edit3 size={20} className="text-blue-500"/> Edit User</h3>
              <button onClick={() => setEditModal({ show: false, user: null })} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors cursor-pointer"><X size={18} strokeWidth={2.5}/></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" required autoComplete="off" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-900" value={editModal.user.name} onChange={(e) => setEditModal({ ...editModal, user: { ...editModal.user, name: e.target.value }})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                {/* 🌟 FIX: Dynamic type attribute allows "admin" */}
                <input type={isEditUserAdmin ? "text" : "email"} required autoComplete="off" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-900" value={editModal.user.email} onChange={(e) => setEditModal({ ...editModal, user: { ...editModal.user, email: e.target.value }})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between"><span>New Password</span><span className="text-gray-400 font-normal">Optional</span></label>
                <input type="password" autoComplete="new-password" placeholder="Leave blank to keep current" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-900 placeholder:text-sm" value={editModal.user.password} onChange={(e) => setEditModal({ ...editModal, user: { ...editModal.user, password: e.target.value }})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                <input type="text" disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed outline-none font-bold" value={editModal.user.role} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-md mt-4 cursor-pointer active:scale-95">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation & Status Modals */}
      {confirmArchive.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm text-center animate-in zoom-in duration-200 scale-100">
            <div className="w-20 h-20 bg-red-50 border-8 border-red-100/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Archive User?</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              {confirmArchive.isBulk ? `Archive ${selectedUsers.length} selected users? They will lose access to the platform.` : `Archive ${confirmArchive.userName}? They will lose access to the platform.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmArchive({ show: false, userId: null, userName: '', isBulk: false })} className="flex-1 font-bold py-3.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer">Cancel</button>
              <button onClick={executeArchive} className="flex-1 font-bold py-3.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer">Yes, Archive</button>
            </div>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm text-center animate-in zoom-in duration-200 scale-100">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-8 ${modal.type === 'error' ? 'bg-red-50 border-red-100/50 text-red-600' : 'bg-emerald-50 border-emerald-100/50 text-emerald-500'}`}>
              {modal.type === 'error' ? <AlertTriangle size={32} strokeWidth={2.5} /> : <CheckCircle2 size={32} strokeWidth={2.5} />}
            </div>
            <h2 className={`text-2xl font-extrabold mb-2 tracking-tight ${modal.type === 'error' ? 'text-red-600' : 'text-gray-900'}`}>{modal.title}</h2>
            <p className="text-gray-500 font-medium mb-8">{modal.message}</p>
            <button onClick={() => setModal({ show: false, type: '', title: '', message: '' })} className="w-full py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-md cursor-pointer active:scale-95">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}