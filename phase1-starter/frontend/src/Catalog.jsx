import React, { useState, useEffect } from 'react';

export default function Catalog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/catalog/events')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#1b2559', marginBottom: '16px' }}>Available Events</h2>
      {loading ? <p>Loading catalog...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {events.length > 0 ? events.map((item, idx) => (
            <div key={idx} style={{ background: '#f8f9fc', border: '1px solid #e0e5f2', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#2b3674' }}>{item.name || item.title || `Event #${idx + 1}`}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#707eae' }}>{item.description || 'No description available'}</p>
            </div>
          )) : <p style={{ color: '#707eae' }}>No events found in database.</p>}
        </div>
      )}
    </div>
  );
}
