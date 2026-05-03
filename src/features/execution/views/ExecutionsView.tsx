import React from 'react';
import { CheckCircle, AlertCircle, Clock } from '../../../components/icons';

export interface IExecutionViewItem {
  id: string;
  automationId: string;
  automationName: string;
  status: 'success' | 'failed' | 'running';
  startedAt: Date;
  linesCount: number;
}

interface ExecutionsViewProps {
  executions: IExecutionViewItem[];
}

const statusLabel: Record<IExecutionViewItem['status'], string> = {
  success: 'Success',
  failed: 'Failed',
  running: 'Running',
};

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({ executions }) => {
  const total = executions.length;
  const success = executions.filter(item => item.status === 'success').length;
  const failed = executions.filter(item => item.status === 'failed').length;

  return (
    <div className="page-shell">
      <div className="page-head">
        <div>
          <h2>Executions</h2>
          <p>Track recent runs and monitor workflow output activity.</p>
        </div>
      </div>

      <div className="execution-stats-grid">
        <div className="execution-stat-card">
          <Clock size={18} strokeWidth={2.2} />
          <div>
            <strong>{total}</strong>
            <span>Total Runs</span>
          </div>
        </div>
        <div className="execution-stat-card success">
          <CheckCircle size={18} strokeWidth={2.2} />
          <div>
            <strong>{success}</strong>
            <span>Successful</span>
          </div>
        </div>
        <div className="execution-stat-card failed">
          <AlertCircle size={18} strokeWidth={2.2} />
          <div>
            <strong>{failed}</strong>
            <span>Failed</span>
          </div>
        </div>
      </div>

      <div className="execution-list">
        {executions.length === 0 ? (
          <div className="page-empty">No execution history yet. Run a workflow to see results here.</div>
        ) : (
          executions.map(item => (
            <div key={item.id} className="execution-item">
              <div className="execution-item-main">
                <h3>{item.automationName}</h3>
                <p>{item.startedAt.toLocaleString()}</p>
              </div>
              <span className={`execution-status ${item.status}`}>{statusLabel[item.status]}</span>
              <span className="execution-lines">{item.linesCount} output lines</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
