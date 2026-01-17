/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react';
import { FiFolder, FiUsers, FiUpload, FiDownload } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout';
import { Card } from '../components/ui';
import api from '../lib/api';

interface Stats {
  totalFiles: number;
  totalUsers: number;
  myFiles: number;
}

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalUsers: 0, myFiles: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [filesRes, usersRes] = await Promise.all([
        api.get('/files?limit=1'),
        isAdmin ? api.get('/users?limit=1') : Promise.resolve({ data: { pagination: { total: 0 } } }),
      ]);

      setStats({
        totalFiles: isAdmin ? filesRes.data.pagination.total : 0,
        totalUsers: usersRes.data.pagination?.total || 0,
        myFiles: !isAdmin ? filesRes.data.pagination.total : 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = isAdmin
    ? [
        {
          title: 'Fichiers totaux',
          value: stats.totalFiles,
          icon: FiFolder,
          color: 'bg-blue-500',
        },
        {
          title: 'Utilisateurs',
          value: stats.totalUsers,
          icon: FiUsers,
          color: 'bg-green-500',
        },
        {
          title: 'Uploads ce mois',
          value: '-',
          icon: FiUpload,
          color: 'bg-purple-500',
        },
        {
          title: 'Téléchargements',
          value: '-',
          icon: FiDownload,
          color: 'bg-orange-500',
        },
      ]
    : [
        {
          title: 'Mes fichiers',
          value: stats.myFiles,
          icon: FiFolder,
          color: 'bg-blue-500',
        },
        {
          title: 'Téléchargements',
          value: '-',
          icon: FiDownload,
          color: 'bg-green-500',
        },
      ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue, {user?.email?.split('@')[0]} !
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Gérez vos fichiers et utilisateurs depuis ce tableau de bord.'
              : 'Accédez à vos fichiers autorisés depuis ce tableau de bord.'}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} text-white mr-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/files"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiFolder className="w-5 h-5 text-primary-600 mr-3" />
              <span className="font-medium">Voir les fichiers</span>
            </a>
            {isAdmin && (
              <>
                <a
                  href="/upload"
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiUpload className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium">Uploader un fichier</span>
                </a>
                <a
                  href="/users"
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiUsers className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium">Gérer les utilisateurs</span>
                </a>
              </>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
