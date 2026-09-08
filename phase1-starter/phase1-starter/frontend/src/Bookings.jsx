import React, { useState, useEffect } from 'react';

export default function Bookings({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState('');
  const [message, setMessage] = useState('');

  const fetchBookings = () => {
    fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : data.bookings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchBookings();
  }, [token]);

  const handleCreateBooking = (e) => {
    e.preventDefault();
    setMessage('');
    fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ eventId: eventId || '1', tickets: 1 })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage('Error: ' + data.error);
        } else {
          setMessage('Booking created successfully!');
          setEventId('');
          fetchBookings();
        }
      })
      .catch(err => setMessage('Failed to create booking: ' + err.message));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#1b2559', marginBottom: '16px' }}>My Bookings</h2>

      <form onSubmit={handleCreateBooking} style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Event ID (e.g. 1)" 
          value={eventId} 
          onChange={e => setEventId(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e0e5f2', flex: '1' }}
        />
        <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4318ff', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          New Booking
        </button>
      </form>

      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green', marginBottom: '12px' }}>{message}</p>}

      {loading ? <p>Loading bookings...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bookings.length > 0 ? bookings.map((b, idx) => (
            <div key={idx} style={{ background: '#f4f7fe', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Booking #{b.id || idx + 1} - Event ID: {b.eventId || b.event_id || '1'}</span>
              <span style={{ fontWeight: 'bold', color: '#4318ff' }}>{b.status || 'Confirmed'}</span>
            </div>
          )) : <p style={{ color: '#707eae' }}>No active bookings found.</p>}
        </div>
      )}
    </div>
  );
}
