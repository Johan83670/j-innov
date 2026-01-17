/**
 * Files List Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiDownload, FiFolder, FiUsers, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Layout } from '../components/layout';
import { Card, Button, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatFileSize, formatDateShort } from '../lib/utils';
import type { File, PaginationInfo } from '../types';

export function FilesPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [pagination.page]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/files', {
        params: { page: pagination.page, limit: pagination.limit },
      });
      setFiles(response.data.files);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: File) => {
    try {
      // Open download in new tab - the backend handles presigned redirect or proxy
      window.open(`${import.meta.env.VITE_API_URL}/files/${file.id}/download`, '_blank');
      toast.success('Téléchargement lancé');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async (file: File) => {
    if (!confirm(`Supprimer le fichier "${file.originalName}" ?`)) return;

    try {
      await api.delete(`/files/${file.id}`);
      toast.success('Fichier supprimé');
      fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fichiers</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin
                ? 'Tous les fichiers uploadés'
                : 'Fichiers auxquels vous avez accès'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate('/upload')}>
              Uploader un fichier
            </Button>
          )}
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigné à
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="spinner" />
                        <span className="ml-2 text-gray-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucun fichier trouvé
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <FiFolder className="w-5 h-5 text-primary-500 mr-3" />
                          <span className="font-medium text-gray-900 truncate max-w-xs">
                            {file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="primary">{file.projectSlug}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatFileSize(file.sizeBytes)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDateShort(file.uploadedAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {file.assignedUsers && file.assignedUsers.length > 0 ? (
                              file.assignedUsers.slice(0, 2).map((user) => (
                                <Badge key={user.id} variant="default" size="sm">
                                  {user.email.split('@')[0]}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">Aucun</span>
                            )}
                            {file.assignedUsers && file.assignedUsers.length > 2 && (
                              <Badge variant="default" size="sm">
                                +{file.assignedUsers.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file)}
                            title="Télécharger"
                          >
                            <FiDownload className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/files/${file.id}`)}
                                title="Gérer les accès"
                              >
                                <FiUsers className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(file)}
                                title="Supprimer"
                              >
                                <FiTrash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
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
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} fichiers)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  <FiChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
