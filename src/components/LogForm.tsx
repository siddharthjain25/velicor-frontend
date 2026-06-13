import React, { useState } from 'react';
import { ingestLogs, type LogEntry } from '../api';
import { Button } from './ui/button';
import { useCustomDialog } from '../context/DialogContext';

const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL'] as const;

export const LogForm: React.FC = () => {
  const [formData, setFormData] = useState({
    service_name: 'web-frontend',
    level: 'INFO' as typeof LOG_LEVELS[number],
    message: '',
    metadata: '',
  });
  const [loading, setLoading] = useState(false);
  const customDialog = useCustomDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let metadata = {};
      if (formData.metadata) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch (e) {
          await customDialog.alert({
            title: "Validation Error",
            description: 'Invalid JSON in metadata',
          });
          setLoading(false);
          return;
        }
      }

      const log: LogEntry = {
        timestamp: new Date().toISOString(),
        service_name: formData.service_name,
        level: formData.level,
        message: formData.message,
        metadata,
      };

      await ingestLogs(log, 'dummy-key'); // This component is less used now
      setFormData((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      console.error(err);
      await customDialog.alert({
        title: "Ingestion Error",
        description: 'Failed to send log',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Manual Ingestion</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Service Name</label>
          <input
            type="text"
            value={formData.service_name}
            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Level</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
          >
            {LOG_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Metadata (JSON)</label>
          <input
            type="text"
            placeholder='{"userId": 123}'
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending...' : 'Send Log'}
        </Button>
      </form>
    </div>
  );
};
