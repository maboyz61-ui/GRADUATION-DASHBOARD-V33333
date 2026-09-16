export default function Settings() {
  return (
    <div className="dash-layout">
      <div className="card">
        <h3>Settings</h3>
        <p style={{ color: 'var(--muted)', margin: '10px 0 16px' }}>Portal preferences for the UKZN Photo Platform.</p>
        <label className="field">Email notifications
          <select defaultValue="on"><option value="on">On</option><option value="off">Off</option></select>
        </label>
        <label className="field" style={{ marginTop: 12 }}>Default campus
          <select defaultValue="Howard College">
            <option>Howard College</option>
            <option>Westville</option>
            <option>Pietermaritzburg</option>
            <option>Edgewood</option>
          </select>
        </label>
        <label className="field" style={{ marginTop: 12 }}>Language
          <select defaultValue="en"><option value="en">English</option><option value="zu">isiZulu</option></select>
        </label>
      </div>
      <div className="card">
        <h3>Notification Preferences</h3>
        <p style={{ color: 'var(--muted)', margin: '8px 0 12px' }}>Ceremony photos, order updates and identifier alerts.</p>
        <label className="field">SMS alerts<select defaultValue="on"><option value="on">On</option><option value="off">Off</option></select></label>
      </div>
    </div>
  )
}
