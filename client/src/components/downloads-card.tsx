import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import PageLoader from "@/components/ui/page-loader";
import { useToast } from "@/hooks/use-toast";
import { Download, FileAudio, Archive, RotateCcw, CheckCircle, Loader2, AlertCircle, UploadCloud } from "lucide-react";

interface Selection {
  id: string;
  title: string;
  status: string;
  filename: string | null;
  fileSize: number | null;
  startTime: number;
  endTime: number;
}

interface Job {
  id: string;
  status: string;
  progress: number;
  error: string | null;
}

interface DownloadsCardProps {
  jobId: string;
  videoId: string;
  onReset: () => void;
}

export default function DownloadsCard({ jobId, videoId, onReset }: DownloadsCardProps) {
  const [pollingInterval, setPollingInterval] = useState(1000);
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingSelectionId, setUploadingSelectionId] = useState<string | null>(null);
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/jobs", jobId],
    refetchInterval: pollingInterval,
  });

  const job: Job | undefined = (data as any)?.job;
  const selections: Selection[] = (data as any)?.selections || [];

  useEffect(() => {
    if (job?.status === "completed" || job?.status === "error") {
      setPollingInterval(0);
    }
  }, [job?.status]);

  // Établir la connexion WebSocket
  useEffect(() => {
    if (!jobId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // CORRECTION : Ajouter le chemin '/ws' à l'URL de connexion
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      ws.current?.send(JSON.stringify({ type: 'register', jobId }));
    };

    ws.current.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);

      if (type === 'upload-success') {
        toast({
          title: "Envoi réussi ✅",
          description: `Le fichier "${payload.fileName}" est sur votre Google Drive.`,
        });
      } else if (type === 'upload-failure') {
        toast({
          title: "Échec de l'envoi ❌",
          description: `L'envoi du fichier "${payload.fileName}" a échoué.`,
          variant: "destructive",
        });
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, [jobId, toast]);

  // Écouter les messages de la popup d'authentification
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { type, message } = event.data;
      if (type === 'success') {
        toast({
          title: "Authentification réussie",
          description: "L'envoi vers Google Drive a commencé.",
        });
      } else if (type === 'error') {
        toast({
          title: "Erreur d'authentification",
          description: message || "L'envoi a échoué.",
          variant: "destructive",
        });
      }
      setUploadingSelectionId(null);
    };
    window.addEventListener('message', handleAuthMessage);
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [toast]);

  const completedSelections = selections.filter(s => s.status === "completed");

  const handleDownload = async (selectionId: string) => {
    setDownloading(true);
    setDownloadMessage("Préparation du téléchargement...");
    try {
      const response = await fetch(`/api/download/${selectionId}`);
      if (!response.ok) { throw new Error('Download failed'); }
      setDownloadMessage("Téléchargement...");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadMessage("Téléchargement terminé !");
      setShowSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      console.error('Download failed:', err);
      toast({ title: "Erreur", description: "Le téléchargement a échoué.", variant: "destructive" });
    } finally {
      setDownloading(false);
      setDownloadMessage("");
      setShowSuccess(false);
    }
  };

  const handleDownloadAll = async () => {
    // Implémentation
  };

  const handleSendToDrive = async (selectionId: string) => {
    setUploadingSelectionId(selectionId);
    try {
      const response = await fetch('/api/drive/google/initiate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectionId }),
      });
      if (!response.ok) { throw new Error(await response.text()); }
      const { authUrl } = await response.json();
      window.open(authUrl, 'googleAuth', 'width=600,height=700,menubar=no,toolbar=no');
    } catch (err) {
      console.error('Failed to start Drive upload:', err);
      toast({
        title: "Erreur",
        description: `Impossible de démarrer le processus d'envoi.`,
        variant: "destructive",
      });
      setUploadingSelectionId(null);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Inconnu";
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "processing": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Loader2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="secondary" className="bg-success/10 text-success">Terminé</Badge>;
      case "processing": return <Badge variant="secondary" className="bg-primary/10 text-primary">En cours...</Badge>;
      case "error": return <Badge variant="destructive">Erreur</Badge>;
      default: return <Badge variant="outline">En attente</Badge>;
    }
  };

  if (isLoading) {
    return <Card className="shadow-material"><CardContent className="p-6"><div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-2">Chargement...</span></div></CardContent></Card>;
  }

  if (error) {
    return <Card className="shadow-material"><CardContent className="p-6"><div className="text-center py-8 text-destructive"><AlertCircle className="h-8 w-8 mx-auto mb-2" /><p>Échec du chargement.</p></div></CardContent></Card>;
  }

  return (
    <>
      <PageLoader isVisible={downloading} message={downloadMessage} showSuccess={showSuccess} />
      <Card className="shadow-material">
        <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center"><Download className="text-success mr-2" />Statut & Téléchargements</h2>
          <Button variant="outline" onClick={onReset} className="flex items-center space-x-2"><RotateCcw className="h-4 w-4" /><span>Nouvelle Tâche</span></Button>
        </div>

        {job && job.status !== "pending" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm text-gray-600">{completedSelections.length} sur {selections.length} terminé(s)</span>
            </div>
            <Progress value={job.progress} className="h-2" />
            {job.status === "error" && (<div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">Erreur: {job.error}</div>)}
          </div>
        )}

        <div className="space-y-3">
          {selections.map((selection) => (
            <div key={selection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center"><FileAudio className="text-white h-5 w-5" /></div>
                <div>
                  <h3 className="font-medium text-gray-900">{selection.filename || `${selection.title}.mp3`}</h3>
                  <p className="text-sm text-gray-600">{formatDuration(selection.startTime, selection.endTime)} • {selection.fileSize ? ` ${formatFileSize(selection.fileSize)} • ` : " "}{getStatusBadge(selection.status)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selection.status)}
                {selection.status === "completed" && (
                  <>
                    <Button onClick={() => handleDownload(selection.id)} className="flex items-center space-x-2"><Download className="h-4 w-4" /><span>Télécharger</span></Button>
                    <Button 
                      onClick={() => handleSendToDrive(selection.id)} 
                      variant="outline" 
                      className="flex items-center space-x-2"
                      disabled={uploadingSelectionId != null}
                    >
                      {uploadingSelectionId === selection.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      <span>Envoyer au Drive</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {completedSelections.length > 1 && (
            <div className="pt-4 border-t border-gray-200">
              <Button onClick={handleDownloadAll} variant="secondary" className="w-full flex items-center justify-center space-x-2"><Archive className="h-4 w-4" /><span>Tout télécharger (ZIP)</span></Button>
            </div>
          )}

          {selections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Download className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Aucun fichier prêt.</p>
              <p className="text-sm">Les fichiers traités apparaîtront ici.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}