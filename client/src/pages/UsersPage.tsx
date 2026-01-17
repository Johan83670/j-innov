/**
 * Users Management Page
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus,
  FiKey,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
} from 'react-icons/fi';
import { Layout } from '../components/layout';
import { Card, Button, Badge, Modal, Input, Select } from '../components/ui';
import api from '../lib/api';
import { formatDateShort, checkPasswordStrength } from '../lib/utils';
import type { User, PaginationInfo } from '../types';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Create user modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'USER' });
  const [createErrors, setCreateErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isCreating, setIsCreating] = useState(false);

  // Reset password modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const validateCreate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!newUser.email) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Email invalide';
    }

    const pwdCheck = checkPasswordStrength(newUser.password);
    if (!pwdCheck.isValid) {
      errors.password = pwdCheck.message;
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateCreate()) return;

    setIsCreating(true);
    try {
      await api.post('/users', newUser);
      toast.success('Utilisateur créé');
      setIsCreateModalOpen(false);
      setNewUser({ email: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;

    setIsResetting(true);
    try {
      const response = await api.patch(`/users/${resetUserId}/reset-password`);
      setTempPassword(response.data.temporaryPassword);
      toast.success('Mot de passe réinitialisé');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur "${user.email}" ?`)) return;

    try {
      await api.delete(`/users/${user.id}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  const openResetModal = (userId: string) => {
    setResetUserId(userId);
    setTempPassword(null);
    setIsResetModalOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-gray-600 mt-1">Gérez les comptes utilisateurs</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FiPlus className="w-4 h-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichiers
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="spinner" />
                        <span className="ml-2 text-gray-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">{user.email}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={user.role === 'ADMIN' ? 'primary' : 'default'}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {user.assignedFilesCount || 0} fichier(s)
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {user.createdAt ? formatDateShort(user.createdAt) : '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetModal(user.id)}
                            title="Réinitialiser le mot de passe"
                          >
                            <FiKey className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages} (
                {pagination.total} utilisateurs)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  <FiChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  <FiChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create user modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un utilisateur"
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            error={createErrors.email}
            placeholder="utilisateur@example.com"
          />

          <Input
            label="Mot de passe"
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            error={createErrors.password}
            helperText="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
          />

          <Select
            label="Rôle"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            options={[
              { value: 'USER', label: 'Utilisateur' },
              { value: 'ADMIN', label: 'Administrateur' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateUser}
              isLoading={isCreating}
              className="flex-1"
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setTempPassword(null);
        }}
        title="Réinitialiser le mot de passe"
      >
        {tempPassword ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-2">
                Nouveau mot de passe temporaire :
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded font-mono text-sm break-all">
                  {tempPassword}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(tempPassword)}
                >
                  <FiCopy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              ⚠️ Ce mot de passe ne sera plus affiché. Partagez-le de manière
              sécurisée avec l'utilisateur.
            </p>
            <Button
              onClick={() => {
                setIsResetModalOpen(false);
                setTempPassword(null);
              }}
              className="w-full"
            >
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Un nouveau mot de passe temporaire sera généré. L'utilisateur
              devra le changer lors de sa prochaine connexion.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleResetPassword}
                isLoading={isResetting}
                className="flex-1"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
