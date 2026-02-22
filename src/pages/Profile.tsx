import { useState, useRef, useEffect } from 'react';
import { Camera, Share2, Moon, Bell, Globe, LogOut, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Profile() {
  const { user, logout, updateUserProfile, updateUserSettings } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [isLangDialogOpen, setIsLangDialogOpen] = useState(false);

  // Settings state from user
  const [settings, setSettings] = useState({
    darkMode: user?.settings?.theme === 'dark',
    notifications: user?.settings?.notificationsEnabled ?? true,
    language: user?.settings?.language || 'pt-BR'
  });

  // Update local state when user data changes
  useEffect(() => {
    if (user?.settings) {
      setSettings({
        darkMode: user.settings.theme === 'dark',
        notifications: user.settings.notificationsEnabled ?? true,
        language: user.settings.language || 'pt-BR'
      });
    }
    setName(user?.name || '');
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile({ name });
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
    setLoading(false);
  };

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const settingsToUpdate: any = {};
      
      if (key === 'darkMode') {
        settingsToUpdate.theme = value ? 'dark' : 'light';
      }
      if (key === 'notifications') {
        settingsToUpdate.notificationsEnabled = value;
      }
      if (key === 'language') {
        settingsToUpdate.language = value;
      }

      await updateUserSettings(settingsToUpdate);
      toast.success('Configuração salva!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Finanças PWA',
      text: 'Venha controlar suas finanças comigo!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to Firebase Storage
      // For now, just create a local URL
      const url = URL.createObjectURL(file);
      try {
        await updateUserProfile({ photoURL: url });
        toast.success('Foto atualizada!');
      } catch (error) {
        toast.error('Erro ao atualizar foto');
      }
    }
  };

  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      'pt-BR': 'Português (Brasil)',
      'en': 'English'
    };
    return languages[code] || code;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-slate-400">Gerencie suas informações e preferências</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.photoURL} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="mt-4 text-center">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                  <p className="text-slate-400">{user?.email}</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsEditing(true)}>
                    Editar perfil
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <Moon className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-white font-medium">Modo Escuro</p>
                <p className="text-sm text-slate-400">Tema escuro do aplicativo</p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(v) => handleSettingChange('darkMode', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-white font-medium">Notificações</p>
                <p className="text-sm text-slate-400">Receber alertas e lembretes</p>
              </div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(v) => handleSettingChange('notifications', v)}
            />
          </div>

          <Dialog open={isLangDialogOpen} onOpenChange={setIsLangDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Idioma</p>
                    <p className="text-sm text-slate-400">{getLanguageLabel(settings.language)}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Selecionar Idioma</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {['pt-BR', 'en'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      handleSettingChange('language', lang);
                      setIsLangDialogOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <span>{getLanguageLabel(lang)}</span>
                    {settings.language === lang && <Check className="w-5 h-5 text-blue-500" />}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5 text-blue-500" />
            Compartilhar app
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 bg-slate-800 border-slate-700 hover:bg-slate-700 text-red-500"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Confirmar logout</DialogTitle>
              </DialogHeader>
              <p className="text-slate-400">Tem certeza que deseja sair da sua conta?</p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1">Cancelar</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-slate-500 text-sm">
        <p>Finanças PWA v1.0.0</p>
        <p>Desenvolvido com React + Firebase</p>
      </div>
    </div>
  );
}
