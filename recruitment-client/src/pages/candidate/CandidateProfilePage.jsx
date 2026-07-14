import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import './CandidateProfilePage.css';

const CandidateProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ fullName: '', phoneNumber: '', skills: '' });
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Resume upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [extractedSkillsFromUpload, setExtractedSkillsFromUpload] = useState('');
  const [showUseAiSkillsButton, setShowUseAiSkillsButton] = useState(false);

  // AI Skill Extractor states
  const [extractorText, setExtractorText] = useState('');
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState('');
  const [extractedSkillList, setExtractedSkillList] = useState([]);
  const [extractError, setExtractError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/Candidates/my-profile');
      setProfile(response.data);
      setEditData({
        fullName: response.data.fullName || '',
        phoneNumber: response.data.phoneNumber || '',
        skills: response.data.skills || ''
      });
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Profile editing
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
    setSaveMessage('');
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setSaveMessage('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveMessage('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await apiClient.put('/Candidates/my-profile', {
        fullName: editData.fullName,
        phoneNumber: editData.phoneNumber,
        skills: editData.skills
      });
      setProfile(response.data);
      setIsEditing(false);
      setSaveMessage('✅ Profile updated successfully!');
      setEditData({
        fullName: response.data.fullName || '',
        phoneNumber: response.data.phoneNumber || '',
        skills: response.data.skills || ''
      });
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setSaveMessage(`❌ Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Resume upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadMessage('Error: Only .pdf, .doc, .docx files are allowed.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadMessage('Error: File size exceeds 5MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file first.');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await apiClient.post('/Candidates/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      let successMsg = `✅ ${data.message}`;
      if (data.extractionMessage) {
        successMsg += `\n${data.extractionMessage}`;
      }

      setUploadMessage(successMsg);
      setSelectedFile(null);

      const profileRes = await apiClient.get('/Candidates/my-profile');
      setProfile(profileRes.data);

      if (data.skillsAutoUpdated && profileRes.data.skills) {
        setEditData({
          ...editData,
          skills: profileRes.data.skills
        });
      }

      if (data.extractedSkills && !data.skillsAutoUpdated && data.extractedSkills !== 'No skills identified') {
        setExtractedSkillsFromUpload(data.extractedSkills);
        setShowUseAiSkillsButton(true);
      }

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed.';
      setUploadMessage(`❌ Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUseAiSkills = () => {
    if (extractedSkillsFromUpload) {
      setEditData({
        ...editData,
        skills: extractedSkillsFromUpload
      });
      setShowUseAiSkillsButton(false);
      setExtractedSkillsFromUpload('');
      setUploadMessage('✅ AI-extracted skills applied to your profile!');
      const refreshProfile = async () => {
        const profileRes = await apiClient.get('/Candidates/my-profile');
        setProfile(profileRes.data);
      };
      refreshProfile();
    }
  };

  // AI Skill Extractor
  const handleExtractSkills = async () => {
    if (!extractorText.trim()) return;
    setExtractingSkills(true);
    setExtractError('');
    setExtractedSkills('');
    setExtractedSkillList([]);
    try {
      const response = await apiClient.post('/AI/extract-skills', {
        profileText: extractorText
      });
      setExtractedSkills(response.data.extractedSkills);
      setExtractedSkillList(response.data.skillList || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to extract skills.';
      setExtractError(msg);
    } finally {
      setExtractingSkills(false);
    }
  };

  const handleApplyExtractedSkills = () => {
    if (extractedSkills) {
      setEditData({ ...editData, skills: extractedSkills });
      setExtractorText('');
      setExtractedSkills('');
      setExtractedSkillList([]);
    }
  };

  if (loading) {
    return <div className="candidate-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="candidate-error">{error}</div>;
  }

  return (
    <div className="candidate-profile-container">
      <h1 className="candidate-profile-title">My Profile</h1>

      <div className="candidate-profile-card">
        {!isEditing ? (
          // View mode
          <div>
            <div className="candidate-profile-row">
              <span><strong>Name:</strong> {profile.fullName}</span>
              <span><strong>Email:</strong> {profile.email}</span>
            </div>
            <div className="candidate-profile-row">
              <span><strong>Phone:</strong> {profile.phoneNumber || 'Not set'}</span>
              <span><strong>Skills:</strong> {profile.skills || 'Not set'}</span>
            </div>
            <div className="candidate-profile-row">
              <span>
                <strong>Resume:</strong> {profile.hasResume ? (
                  <a href={`https://localhost:7241/${profile.resumeFilePath}`} target="_blank" rel="noopener noreferrer">
                    View Resume
                  </a>
                ) : 'Not uploaded'}
              </span>
              <span><strong>Member since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="candidate-profile-actions">
              <button onClick={handleStartEdit} className="candidate-edit-btn">Edit Profile</button>
            </div>
            {saveMessage && <p className={saveMessage.startsWith('✅') ? 'candidate-success' : 'candidate-error'}>{saveMessage}</p>}
          </div>
        ) : (
          // Edit mode
          <div>
            <div className="candidate-profile-row">
              <div className="candidate-form-group">
                <label className="candidate-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleEditChange}
                  className="candidate-input"
                />
              </div>
              <div className="candidate-form-group">
                <label className="candidate-label">Email (read-only)</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="candidate-input candidate-input-disabled"
                />
              </div>
            </div>
            <div className="candidate-profile-row">
              <div className="candidate-form-group">
                <label className="candidate-label">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editData.phoneNumber}
                  onChange={handleEditChange}
                  className="candidate-input"
                />
              </div>
              <div className="candidate-form-group">
                <label className="candidate-label">Skills</label>
                <input
                  type="text"
                  name="skills"
                  value={editData.skills}
                  onChange={handleEditChange}
                  className="candidate-input"
                  placeholder="e.g. C#, React, MySQL"
                />
                <span className="candidate-hint">Enter skills separated by commas</span>
              </div>
            </div>
            <div className="candidate-profile-actions">
              <button onClick={handleSaveProfile} disabled={saving} className="candidate-save-btn">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancelEdit} className="candidate-cancel-btn">Cancel</button>
            </div>
            {saveMessage && <p className={saveMessage.startsWith('✅') ? 'candidate-success' : 'candidate-error'}>{saveMessage}</p>}
          </div>
        )}

        {/* AI Skill Extractor */}
        <div className="candidate-ai-extractor-section">
          <h4>AI Skill Extractor</h4>
          <p className="candidate-hint">Paste your CV or profile text to auto-extract skills</p>
          <div className="candidate-extractor-row">
            <textarea
              value={extractorText}
              onChange={(e) => setExtractorText(e.target.value)}
              placeholder="Paste your CV text here..."
              rows={4}
              className="candidate-extractor-textarea"
            />
          </div>
          <div className="candidate-extractor-actions">
            <button
              onClick={handleExtractSkills}
              disabled={!extractorText || extractingSkills}
              className="candidate-extractor-btn"
            >
              {extractingSkills ? 'Extracting...' : '🤖 Extract Skills with AI'}
            </button>
            {extractedSkills && (
              <button onClick={handleApplyExtractedSkills} className="candidate-apply-extracted-btn">
                Use These Skills
              </button>
            )}
          </div>
          {extractError && <p className="candidate-error">{extractError}</p>}
          {extractedSkills && (
            <div className="candidate-extracted-skills-result">
              <p><strong>Extracted Skills:</strong></p>
              <div className="candidate-skill-tags">
                {extractedSkillList.map((skill, index) => (
                  <span key={index} className="candidate-skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resume Upload */}
        <div className="candidate-upload-section">
          <h4>Upload New Resume</h4>
          <div className="candidate-upload-row">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={uploading}
              className="candidate-file-input"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="candidate-upload-btn"
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>

          {uploadMessage && (
            <div className={uploadMessage.startsWith('✅') || uploadMessage.startsWith('🤖') ? 'candidate-success' : 'candidate-error'}>
              {uploadMessage}
            </div>
          )}

          {showUseAiSkillsButton && extractedSkillsFromUpload && (
            <div className="candidate-ai-skills-action">
              <p className="candidate-ai-skills-hint">
                💡 AI extracted: <strong>{extractedSkillsFromUpload}</strong>
              </p>
              <button
                onClick={handleUseAiSkills}
                className="candidate-use-ai-skills-btn"
              >
                Use AI-extracted skills instead
              </button>
            </div>
          )}

          {selectedFile && !uploading && (
            <p className="candidate-file-info">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateProfilePage;