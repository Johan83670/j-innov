/**
 * File Details Page - Manage file assignments
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiFolder, FiUserPlus, FiUserMinus, FiDownload } from 'react-icons/fi';
import { Layout } from '../components/layout';
import { Card, Button, Badge, Modal, Select } from '../components/ui';
import api from '../lib/api';
import { formatFileSize, formatDate } from '../lib/utils';
import type { File as FileType, User } from '../types';

export function FileDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileType | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fileRes, usersRes] = await Promise.all([
        api.get(`/files/${id}`),
        api.get('/users?limit=100'),
      ]);
      setFile(fileRes.data.file);
      setAllUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Erreur lors du chargement');
      navigate('/files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    setIsAssigning(true);
    try {
      await api.post('/assignments', {
        fileId: id,
        userId: selectedUserId,
      });
      toast.success('Utilisateur assigné');
      setIsAssignModalOpen(false);
      setSelectedUserId('');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Erreur lors de l'assignation");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    if (!confirm('Retirer cet utilisateur ?')) return;

    try {
      await api.delete(`/assignments/file/${id}/user/${userId}`);
      toast.success('Utilisateur retiré');
      fetchData();
    } catch (error) {
      console.error('Unassign error:', error);
      toast.error('Erreur lors du retrait');
    }
  };

  const handleDownload = () => {
    window.open(`${import.meta.env.VITE_API_URL}/files/${id}/download`, '_blank');
  };

  // Filter out already assigned users
  const availableUsers = allUsers.filter(
    (user) => !file?.assignedUsers?.some((au) => au.id === user.id)
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!file) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Fichier non trouvé</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/files')}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* File info card */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-4">
                <FiFolder className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{file.originalName}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="primary">{file.projectSlug}</Badge>
                  <span className="text-sm text-gray-500">
                    {formatFileSize(file.sizeBytes)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Uploadé le {formatDate(file.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={handleDownload}>
              <FiDownload className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-mono text-gray-500">
              SHA256: {file.sha256}
            </p>
          </div>
        </Card>

        {/* Assignments card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Utilisateurs assignés
            </h2>
            <Button
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              disabled={availableUsers.length === 0}
            >
              <FiUserPlus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {file.assignedUsers && file.assignedUsers.length > 0 ? (
            <div className="space-y-2">
              {file.assignedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(user.id)}
                    title="Retirer l'accès"
                  >
                    <FiUserMinus className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Aucun utilisateur assigné à ce fichier
            </p>
          )}
        </Card>
      </div>

      {/* Assign user modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assigner un utilisateur"
      >
        <div className="space-y-4">
          <Select
            label="Utilisateur"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={availableUsers.map((user) => ({
              value: user.id,
              label: `${user.email} (${user.role})`,
            }))}
            placeholder="Sélectionner un utilisateur"
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsAssignModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              isLoading={isAssigning}
              disabled={!selectedUserId}
              className="flex-1"
            >
              Assigner
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
