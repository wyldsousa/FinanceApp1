import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email) {
      setLocalError('Digite seu email');
      return;
    }

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Error is handled by useAuth
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Email enviado!</h2>
              <p className="text-slate-400 mb-6">
                Verifique sua caixa de entrada para redefinir sua senha.
              </p>
              <Link to="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Recuperar senha</CardTitle>
            <CardDescription className="text-slate-400">
              Digite seu email para receber instruções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(error || localError) && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertDescription className="text-red-400">
                  {error || localError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </form>

            <Link 
              to="/login" 
              className="flex items-center justify-center gap-2 text-sm text-blue-500 hover:text-blue-400"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
