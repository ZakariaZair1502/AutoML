
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { CustomCard, CustomCardHeader, CustomCardBody } from '@/components/ui/custom-card';
import { CustomButton } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  fullname: string;
  username: string;
  password: string;
  role: string;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Form states
  const [registerForm, setRegisterForm] = useState({
    fullname: '',
    username: '',
    password: '',
    role: '',
  });

  const [editForm, setEditForm] = useState({
    fullname: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual endpoint
      const response = await fetch('http://localhost:5000/admin/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log(data);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
      // Mock data for development
      setUsers([
        { fullname: 'John Doe', username: 'johndoe', password: '2024-01-15', role: "user" },
        { fullname: 'Jane Smith', username: 'janesmith', password: '2024-01-20', role: "admin" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.fullname || !registerForm.username || !registerForm.password || !registerForm.role) {

      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(registerForm)
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      const data = await response.json();
      console.log(data);

      toast({
        title: "Succès",
        description: "User created successfully"
      });

      setRegisterForm({ fullname: '', username: '', password: '', role: '' });

      setIsRegisterOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error registering user:', error);
      toast({
        title: "Erreur",
        description: "Unable to create user",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.fullname || !editForm.username) {
      toast({
        title: "Error",
        description: "Full name and username are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData = {
        fullname: editForm.fullname,
        username: editForm.username,
        ...(editForm.password && { password: editForm.password })
      };
      console.log("update data",updateData);
      const response = await fetch(`http://localhost:5000/admin/users/${editingUser?.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast({
        title: "Success",
        description: "User modified successfully"
      });

      setEditForm({ fullname: '', username: '', password: '' });
      setIsEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Unable to modify user",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Unable to delete user",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      fullname: user.fullname,
      username: user.username,
      password: ''
    });
    setIsEditOpen(true);
  };

  if (loading) {
    return (
      <Layout showNavbar={false} showFooter={false}>
        <div className="min-h-screen py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-white text-lg">Loading users ...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false} showFooter={false}>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Admin users
            </h1>
            <p className="text-gray-300">
              Manage users accounts
            </p>
          </div>

          <CustomCard>
            <CustomCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">Users list</h2>
                </div>
                
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <CustomButton className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4" />
                      <span>New user</span>
                    </CustomButton>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/20">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create new user</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label htmlFor="fullname" className="text-white">Full name</Label>
                        <Input
                          id="fullname"
                          value={registerForm.fullname}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, fullname: e.target.value }))}
                          placeholder="Nom complet"
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="username" className="text-white">Username</Label>
                        <Input
                          id="username"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Nom d'utilisateur"
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Mot de passe"
                            className="bg-white/10 border-white/20 text-white pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Role</Label>
                        <RadioGroup
                          value={registerForm.role}
                          onValueChange={(value) => setRegisterForm(prev => ({ ...prev, role: value }))}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="user" id="role-user" />
                            <Label htmlFor="role-user" className="text-white">User</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="role-admin" />
                            <Label htmlFor="role-admin" className="text-white">Admin</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <CustomButton type="submit" className="w-full">
                        Create user
                      </CustomButton>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CustomCardHeader>
            
            <CustomCardBody>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Full name</TableHead>
                    <TableHead className="text-white">Username</TableHead>
                    <TableHead className="text-white">Role</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell className="text-gray-300">{user.fullname}</TableCell>
                      <TableCell className="text-gray-300">{user.username}</TableCell>
                      <TableCell className="text-gray-300">{user.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </CustomButton>
                          <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.username)}
                            className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </CustomButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Aucun utilisateur trouvé</p>
                </div>
              )}
            </CustomCardBody>
          </CustomCard>

          {/* Edit User Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="bg-slate-900 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Edit user</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label htmlFor="editfullname" className="text-white">Full name</Label>
                  <Input
                    id="editfullname"
                    value={editForm.fullname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullname: e.target.value }))}
                    placeholder="Nom complet"
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editUsername" className="text-white">Username</Label>
                  <Input
                    id="editUsername"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Username"
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editPassword" className="text-white">New password (optional)</Label>
                  <div className="relative">
                    <Input
                      id="editPassword"
                      type={showPassword ? "text" : "password"}
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Laisser vide pour conserver l'ancien"
                      className="bg-white/10 border-white/20 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <CustomButton type="submit" className="w-full">
                  Edit user
                </CustomButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
