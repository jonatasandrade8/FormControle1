# Instruções Copilot para FormControle1

## Visão Geral do Sistema
Este é um sistema web de contagem de estoque e caixas secas para uma rede de lojas de frutas. O sistema gerencia inventários diários e contagem de caixas secas em múltiplos estados, redes e lojas.

## Estrutura do Projeto
- `index.html`: Interface principal com três abas principais (Inventário Diário, Caixas Secas, Gestores)
- `script.js`: Toda a lógica de negócios e manipulação de dados
- `style.css`: Estilos da aplicação
- `attached_assets/`: Diretório com imagens e recursos

## Padrões e Convenções

### Estrutura de Dados
```javascript
const networksByState = {
    "Rio Grande do Norte": ["Rede Nordeste", "Rede RN"],
    // ...
};

const storesByNetwork = {
    "Rede Nordeste": ["Loja Nordeste Shopping", "Loja Nordeste Center"],
    // ...
};

let systemConfig = {
    inventoryTime: "13:00",
    inventoryDays: [1, 2, 3, 4, 5], // Segunda a sexta
    usersByState: { /* ... */ },
    emails: [ /* ... */ ]
};
```

### Fluxos de Dados
1. Seleção hierárquica: Estado -> Usuário -> Rede -> Loja
2. Filas de submissão: `inventorySubmissionQueue` e `dryBoxesSubmissionQueue`
3. Status de envios por usuário/região/rede: `submissionStatus`

### Padrões de Nomenclatura
- Funções de atualização: `updateXByY` (ex: `updateNetworksByState`)
- Funções de visualização: `showX` (ex: `showTab`)
- Estados de navegação: `XViewState` (ex: `pendingViewState`)

### Autenticação
- Área de gestores protegida por senha (constante `MANAGER_PASSWORD`)
- Estado de autenticação controlado por `managerAuthenticated`

## Fluxos de Desenvolvimento

### Adicionando Nova Funcionalidade
1. Adicionar constantes/configurações em `script.js`
2. Atualizar interface em `index.html`
3. Adicionar estilos em `style.css`
4. Implementar handlers de eventos em `script.js`

### Debugando
- Use `console.log()` para depurar filas de submissão e status
- Verifique atualizações de estado nas funções `updateX`
- Monitore eventos de submissão automática via console

### Atualizando Configurações
1. Modifique `systemConfig` para horários e dias
2. Atualize `networksByState` e `storesByNetwork` para estrutura organizacional
3. Gerencie usuários via `usersByState`

## Dicas
- Mantenha a hierarquia Estado -> Rede -> Loja em todas as operações
- Atualize os selects em cascata após alterações nos dados
- Use as filas de submissão para gerenciar envios pendentes
- Verifique permissões antes de operações de gestão
