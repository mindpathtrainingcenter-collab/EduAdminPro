import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Terjadi kesalahan yang tidak terduga.";
      
      try {
        // Check if it's a Firestore permission error (JSON string)
        if (this.state.error?.message.startsWith('{')) {
          const errorData = JSON.parse(this.state.error.message);
          if (errorData.error.includes('insufficient permissions')) {
            errorMessage = "Anda tidak memiliki izin untuk melakukan aksi ini. Pastikan peran (role) Anda sesuai.";
          }
        }
      } catch (e) {
        // Not a JSON error, keep default
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ups! Ada Masalah</h2>
          <p className="text-slate-500 max-w-md mb-8">
            {errorMessage}
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReset} variant="outline" className="gap-2">
              <RefreshCcw size={18} />
              Muat Ulang
            </Button>
            <Button onClick={() => window.location.href = '/'} className="bg-purple-600 hover:bg-purple-700">
              Kembali ke Dashboard
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-8 p-4 bg-slate-100 rounded text-left text-xs overflow-auto max-w-full text-slate-600">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
