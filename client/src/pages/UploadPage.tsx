/**
 * Upload Page with Drag & Drop
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiX, FiCheck } from 'react-icons/fi';
import { Layout } from '../components/layout';
import { Card, Button, Input } from '../components/ui';
import api from '../lib/api';
import { formatFileSize } from '../lib/utils';

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [projectSlug, setProjectSlug] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<{ projectSlug?: string }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
        toast.error('Seuls les fichiers .zip sont acceptés');
        return;
      }

      setFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        'application/zip': ['.zip'],
        'application/x-zip-compressed': ['.zip'],
      },
      maxFiles: 1,
      multiple: false,
    });

  const validate = (): boolean => {
    const newErrors: { projectSlug?: string } = {};

    if (!projectSlug.trim()) {
      newErrors.projectSlug = 'Le slug du projet est requis';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(projectSlug)) {
      newErrors.projectSlug =
        'Seules les lettres, chiffres, tirets et underscores sont autorisés';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (!validate()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectSlug', projectSlug.trim());

      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        },
      });

      toast.success('Fichier uploadé avec succès !');
      navigate('/files');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uploader un fichier</h1>
          <p className="text-gray-600 mt-1">
            Glissez-déposez un fichier ZIP ou cliquez pour sélectionner
          </p>
        </div>

        <Card>
          {/* Project slug input */}
          <div className="mb-6">
            <Input
              label="Slug du projet"
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="mon-projet-2024"
              error={errors.projectSlug}
              helperText="Identifiant unique pour le projet (ex: client-janvier-2024)"
            />
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              dropzone
              ${isDragActive ? 'active' : ''}
              ${isDragAccept ? 'accept' : ''}
              ${isDragReject ? 'reject' : ''}
            `}
          >
            <input {...getInputProps()} />
            <FiUploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-gray-700">
                Déposez le fichier ici...
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700">
                  Glissez-déposez un fichier ZIP ici
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ou cliquez pour sélectionner
                </p>
              </>
            )}
          </div>

          {/* Selected file preview */}
          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <FiFile className="w-8 h-8 text-primary-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isUploading}
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Upload en cours...
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/files')}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!file || !projectSlug.trim()}
              className="flex-1"
            >
              <FiCheck className="w-4 h-4 mr-2" />
              Uploader
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
