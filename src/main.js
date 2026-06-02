// ===== MAIN.JS - Ponto de Entrada do Vite =====

// Importar estilos
import './style.css';

// Importar store/estado
import './store.js';

// Importar script principal da aplicação
import '../script.js';

// ===== INICIALIZAÇÃO DO APP =====

// Função para validar que o app carregou corretamente
function initializeApp() {
  console.log('✅ Aplicação inicializada com sucesso!');
  console.log('📦 Vite HMR ativo');
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ===== HMR (Hot Module Replacement) =====
// Atualização automática em desenvolvimento
if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    console.log('🔄 Módulos atualizados via HMR');
  });
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.app = {
  version: '1.0.0',
  ready: true
};
