/**
 * Gerador de PDF para Ficha de Atleta
 * 
 * Conforme REGRAS_GERENCIAMENTO_ATLETAS.md Seção 10.2:
 * - Layout profissional com logo da organização
 * - Cabeçalho: nome do relatório, data/hora geração, quem gerou
 * - Tabelas formatadas
 */

export interface AthletePDFData {
  // Dados pessoais
  athlete_name: string;
  athlete_nickname?: string;
  birth_date: string;
  gender?: 'masculino' | 'feminino';
  nationality?: string;
  
  // Documentos
  athlete_rg?: string;
  athlete_cpf?: string;
  
  // Contatos
  athlete_phone?: string;
  athlete_email?: string;
  guardian_name?: string;
  guardian_phone?: string;
  
  // Endereço
  zip_code?: string;
  street?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  address_state?: string;
  
  // Dados esportivos
  state: string;
  shirt_number?: number;
  main_defensive_position?: { name: string };
  secondary_defensive_position?: { name: string };
  main_offensive_position?: { name: string };
  secondary_offensive_position?: { name: string };
  category?: { name: string };
  
  // Flags
  injured?: boolean;
  medical_restriction?: boolean;
  suspended_until?: string;
  load_restricted?: boolean;
  
  // Organização
  organization?: { name: string };
  
  // Vínculos
  team_registrations?: Array<{
    team?: { name: string; category?: { name: string } };
    start_at: string;
    end_at?: string;
  }>;
}

/**
 * Gera HTML formatado para impressão/PDF da ficha da atleta
 */
export function generateAthletePDFHTML(
  athlete: AthletePDFData, 
  generatedBy: string
): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR');
  const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const birthDate = athlete.birth_date 
    ? new Date(athlete.birth_date).toLocaleDateString('pt-BR')
    : '-';
  
  const age = athlete.birth_date
    ? Math.floor((Date.now() - new Date(athlete.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '-';

  const genderLabel = athlete.gender === 'masculino' ? 'Masculino' : 
                      athlete.gender === 'feminino' ? 'Feminino' : '-';

  const stateLabel = {
    'ativa': 'Ativa',
    'dispensada': 'Dispensada',
    'arquivada': 'Arquivada'
  }[athlete.state] || athlete.state;

  const flags: string[] = [];
  if (athlete.injured) flags.push('🏥 Lesionada');
  if (athlete.medical_restriction) flags.push('⚠️ Restrição Médica');
  if (athlete.suspended_until && new Date(athlete.suspended_until) > new Date()) {
    flags.push(`🚫 Suspensa até ${new Date(athlete.suspended_until).toLocaleDateString('pt-BR')}`);
  }
  if (athlete.load_restricted) flags.push('📉 Carga Restrita');

  const activeRegistrations = athlete.team_registrations?.filter(r => !r.end_at) || [];
  const pastRegistrations = athlete.team_registrations?.filter(r => r.end_at) || [];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ficha da Atleta - ${athlete.athlete_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
    }
    .header-org {
      font-size: 14px;
      color: #666;
    }
    .header-meta {
      text-align: right;
      font-size: 10px;
      color: #666;
    }
    .athlete-header {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .athlete-info h1 {
      font-size: 22px;
      color: #1e293b;
      margin-bottom: 5px;
    }
    .athlete-info .nickname {
      font-size: 14px;
      color: #64748b;
      font-style: italic;
    }
    .badges {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    .badge-state {
      background: #dcfce7;
      color: #166534;
    }
    .badge-state.dispensada {
      background: #fef9c3;
      color: #854d0e;
    }
    .badge-state.arquivada {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-category {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-flag {
      background: #fef3c7;
      color: #92400e;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .field {
      margin-bottom: 8px;
    }
    .field-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-value {
      font-size: 12px;
      color: #1e293b;
      font-weight: 500;
    }
    .team-card {
      padding: 10px;
      background: #f1f5f9;
      border-radius: 6px;
      margin-bottom: 8px;
      border-left: 3px solid #2563eb;
    }
    .team-card.inactive {
      border-left-color: #94a3b8;
      background: #f8fafc;
    }
    .team-name {
      font-weight: 600;
      color: #1e293b;
    }
    .team-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">📋 FICHA DA ATLETA</div>
      <div class="header-org">${athlete.organization?.name || 'HB Track'}</div>
    </div>
    <div class="header-meta">
      <div>Gerado em: ${formattedDate} às ${formattedTime}</div>
      <div>Por: ${generatedBy}</div>
    </div>
  </div>

  <div class="athlete-header">
    <div class="avatar">
      ${athlete.athlete_name?.charAt(0)?.toUpperCase() || '?'}
    </div>
    <div class="athlete-info">
      <h1>${athlete.athlete_name}</h1>
      ${athlete.athlete_nickname ? `<div class="nickname">"${athlete.athlete_nickname}"</div>` : ''}
      <div class="badges">
        <span class="badge badge-state ${athlete.state}">${stateLabel}</span>
        ${athlete.category?.name ? `<span class="badge badge-category">${athlete.category.name}</span>` : ''}
        ${athlete.shirt_number ? `<span class="badge" style="background:#f3e8ff;color:#7c3aed;">Camisa #${athlete.shirt_number}</span>` : ''}
      </div>
      ${flags.length > 0 ? `
        <div class="badges" style="margin-top: 5px;">
          ${flags.map(f => `<span class="badge badge-flag">${f}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">📝 Dados Pessoais</div>
    <div class="grid grid-3">
      <div class="field">
        <div class="field-label">Data de Nascimento</div>
        <div class="field-value">${birthDate}</div>
      </div>
      <div class="field">
        <div class="field-label">Idade</div>
        <div class="field-value">${age} anos</div>
      </div>
      <div class="field">
        <div class="field-label">Gênero</div>
        <div class="field-value">${genderLabel}</div>
      </div>
      <div class="field">
        <div class="field-label">Nacionalidade</div>
        <div class="field-value">${athlete.nationality || 'Brasileira'}</div>
      </div>
      <div class="field">
        <div class="field-label">RG</div>
        <div class="field-value">${athlete.athlete_rg || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">CPF</div>
        <div class="field-value">${athlete.athlete_cpf || '-'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📞 Contatos</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Telefone</div>
        <div class="field-value">${athlete.athlete_phone || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${athlete.athlete_email || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Responsável</div>
        <div class="field-value">${athlete.guardian_name || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Tel. Responsável</div>
        <div class="field-value">${athlete.guardian_phone || '-'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📍 Endereço</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">CEP</div>
        <div class="field-value">${athlete.zip_code || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Logradouro</div>
        <div class="field-value">${athlete.street ? `${athlete.street}, ${athlete.address_number || 's/n'}` : '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Complemento</div>
        <div class="field-value">${athlete.address_complement || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Bairro</div>
        <div class="field-value">${athlete.neighborhood || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Cidade</div>
        <div class="field-value">${athlete.city || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">UF</div>
        <div class="field-value">${athlete.address_state || '-'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏃 Dados Esportivos</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Posição Defensiva Principal</div>
        <div class="field-value">${athlete.main_defensive_position?.name || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Posição Defensiva Secundária</div>
        <div class="field-value">${athlete.secondary_defensive_position?.name || '-'}</div>
      </div>
      <div class="field">
        <div class="field-label">Posição Ofensiva Principal</div>
        <div class="field-value">${athlete.main_offensive_position?.name || 'Goleira (sem posição ofensiva)'}</div>
      </div>
      <div class="field">
        <div class="field-label">Posição Ofensiva Secundária</div>
        <div class="field-value">${athlete.secondary_offensive_position?.name || '-'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏅 Vínculos com Equipes</div>
    ${activeRegistrations.length > 0 ? `
      <div style="margin-bottom: 10px; font-size: 11px; color: #166534; font-weight: 500;">Vínculos Ativos:</div>
      ${activeRegistrations.map(reg => `
        <div class="team-card">
          <div class="team-name">${reg.team?.name || 'Equipe'}</div>
          <div class="team-meta">
            ${reg.team?.category?.name || ''} • Desde ${new Date(reg.start_at).toLocaleDateString('pt-BR')}
          </div>
        </div>
      `).join('')}
    ` : '<p style="color: #64748b; font-size: 11px;">Nenhum vínculo ativo.</p>'}
    
    ${pastRegistrations.length > 0 ? `
      <div style="margin: 15px 0 10px; font-size: 11px; color: #64748b; font-weight: 500;">Vínculos Encerrados:</div>
      ${pastRegistrations.map(reg => `
        <div class="team-card inactive">
          <div class="team-name" style="color: #64748b;">${reg.team?.name || 'Equipe'}</div>
          <div class="team-meta">
            ${reg.team?.category?.name || ''} • ${new Date(reg.start_at).toLocaleDateString('pt-BR')} a ${new Date(reg.end_at!).toLocaleDateString('pt-BR')}
          </div>
        </div>
      `).join('')}
    ` : ''}
  </div>

  <div class="footer">
    <p>Documento gerado pelo sistema HB Track • Este documento é válido apenas para fins de consulta interna</p>
    <p>© ${new Date().getFullYear()} HB Track - Gestão de Handebol</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Abre janela de impressão/PDF com a ficha da atleta
 */
export function printAthletePDF(athlete: AthletePDFData, generatedBy: string): void {
  const html = generateAthletePDFHTML(athlete, generatedBy);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Aguarda carregar e abre diálogo de impressão
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Faz download da ficha como PDF usando a API de impressão do navegador
 */
export function downloadAthletePDF(athlete: AthletePDFData, generatedBy: string): void {
  const html = generateAthletePDFHTML(athlete, generatedBy);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      // Sugere ao usuário salvar como PDF através do diálogo de impressão
      printWindow.print();
    };
  }
}
