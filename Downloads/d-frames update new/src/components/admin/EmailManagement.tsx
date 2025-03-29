import React, { useState, useEffect } from 'react';
import { Inbox, Star, Trash2, Archive, RefreshCw, Send, AlertCircle, X, ChevronLeft, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../LoadingSpinner';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'archive' | 'trash';
  attachments?: string[];
  labels?: string[];
}

type Folder = 'inbox' | 'sent' | 'archive' | 'trash' | 'starred';

interface EmailCounts {
  inbox: number;
  unread: number;
  starred: number;
  sent: number;
  archive: number;
  trash: number;
}

interface ComposeData {
  to: string;
  subject: string;
  body: string;
}

const EmailManagement: React.FC = () => {
  // State management
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<Folder>('inbox');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState<ComposeData>({
    to: '',
    subject: '',
    body: ''
  });
  
  // Email counts
  const [counts, setCounts] = useState<EmailCounts>({
    inbox: 0,
    unread: 0,
    starred: 0,
    sent: 0,
    archive: 0,
    trash: 0
  });

  // Fetch emails from Supabase
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get emails based on current folder
      let query = supabase
        .from('emails')
        .select('*')
        .order('date', { ascending: false });
      
      if (currentFolder === 'starred') {
        query = query.eq('starred', true);
      } else {
        // For non-starred folders, filter by the actual folder name
        query = query.eq('folder', currentFolder);
      }
      
      const { data: emailData, error: fetchError } = await query;
      
      if (fetchError) throw new Error(fetchError.message);
      
      setEmails(emailData || []);
      setFilteredEmails(emailData || []);
      
      // Update counts
      const { data: countData, error: countError } = await supabase
        .from('emails')
        .select('folder, starred, read');
      
      if (countError) throw new Error(countError.message);
      
      if (countData) {
        const newCounts: EmailCounts = {
          inbox: countData.filter(email => email.folder === 'inbox').length,
          unread: countData.filter(email => !email.read).length,
          starred: countData.filter(email => email.starred).length,
          sent: countData.filter(email => email.folder === 'sent').length,
          archive: countData.filter(email => email.folder === 'archive').length,
          trash: countData.filter(email => email.folder === 'trash').length
        };
        
        setCounts(newCounts);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emails';
      setError(errorMessage);
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark email as read
  const markAsRead = async (id: string, isRead: boolean = true) => {
    try {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ read: isRead })
        .eq('id', id);
      
      if (updateError) throw new Error(updateError.message);
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === id ? { ...email, read: isRead } : email
        )
      );
      
      setFilteredEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === id ? { ...email, read: isRead } : email
        )
      );
      
      // Update counts
      setCounts(prevCounts => ({
        ...prevCounts,
        unread: isRead ? Math.max(0, prevCounts.unread - 1) : prevCounts.unread + 1
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark email as read';
      console.error('Error marking email as read:', errorMessage);
    }
  };
  
  // Toggle star status
  const toggleStar = async (id: string) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;
    
    const newStarredStatus = !email.starred;
    
    try {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ starred: newStarredStatus })
        .eq('id', id);
      
      if (updateError) throw new Error(updateError.message);
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === id ? { ...email, starred: newStarredStatus } : email
        )
      );
      
      setFilteredEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === id ? { ...email, starred: newStarredStatus } : email
        )
      );
      
      // Update counts
      setCounts(prevCounts => ({
        ...prevCounts,
        starred: newStarredStatus ? prevCounts.starred + 1 : Math.max(0, prevCounts.starred - 1)
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle star';
      console.error('Error toggling star:', errorMessage);
    }
  };
  
  // Move email to folder
  const moveToFolder = async (id: string, targetFolder: 'inbox' | 'archive' | 'trash') => {
    const email = emails.find(e => e.id === id);
    if (!email) return;
    
    const sourceFolder = email.folder;
    
    try {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ folder: targetFolder })
        .eq('id', id);
      
      if (updateError) throw new Error(updateError.message);
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === id ? { ...email, folder: targetFolder } : email
        )
      );
      
      setFilteredEmails(prevEmails => 
        prevEmails.filter(email => email.id !== id)
      );
      
      // Update counts
      setCounts(prevCounts => ({
        ...prevCounts,
        [sourceFolder]: Math.max(0, prevCounts[sourceFolder as keyof EmailCounts] - 1),
        [targetFolder]: prevCounts[targetFolder as keyof EmailCounts] + 1
      }));
      
      // If viewing the email that was moved, close it
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to move email to ${targetFolder}`;
      console.error(`Error moving email to ${targetFolder}:`, errorMessage);
    }
  };
  
  // Handle email selection
  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      markAsRead(email.id);
    }
  };
  
  // Handle folder change
  const handleFolderChange = (folder: Folder) => {
    setCurrentFolder(folder);
    setSelectedEmail(null);
    fetchEmails();
  };
  
  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredEmails(emails);
      return;
    }
    
    const filtered = emails.filter(email => {
      const lowerQuery = query.toLowerCase();
      return (
        email.subject.toLowerCase().includes(lowerQuery) ||
        email.from.toLowerCase().includes(lowerQuery) ||
        email.body.toLowerCase().includes(lowerQuery)
      );
    });
    
    setFilteredEmails(filtered);
  };
  
  // Send email
  const sendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      setError('Recipient and subject are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error: insertError } = await supabase
        .from('emails')
        .insert([
          {
            from: 'user@example.com', // This would be the current user's email
            to: composeData.to,
            subject: composeData.subject,
            body: composeData.body,
            date: new Date().toISOString(),
            read: true,
            starred: false,
            folder: 'sent'
          }
        ])
        .select();
      
      if (insertError) throw new Error(insertError.message);
      
      // Update counts
      setCounts(prevCounts => ({
        ...prevCounts,
        sent: prevCounts.sent + 1
      }));
      
      // Reset compose data
      setComposeData({
        to: '',
        subject: '',
        body: ''
      });
      
      // Close modal
      setShowComposeModal(false);
      
      // If on sent folder, refresh to show the new email
      if (currentFolder === 'sent') {
        fetchEmails();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      console.error('Error sending email:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial email fetch
  useEffect(() => {
    fetchEmails();
  }, []);
  
  // Render email list
  const renderEmailList = () => {
    if (loading && filteredEmails.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      );
    }
    
    if (filteredEmails.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <span>No emails found</span>
        </div>
      );
    }
    
    return (
      <div className="divide-y divide-gray-700">
        {filteredEmails.map(email => (
          <div 
            key={email.id}
            className={`p-3 hover:bg-gray-800 cursor-pointer transition-colors ${selectedEmail?.id === email.id ? 'bg-gray-800' : ''} ${!email.read ? 'font-semibold' : ''}`}
            onClick={() => handleEmailSelect(email)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {!email.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                )}
                <h3 className="text-md">{email.subject}</h3>
              </div>
              <div className="flex items-center">
                <button
                  className="p-1 hover:bg-gray-700 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(email.id);
                  }}
                >
                  <Star className={`w-4 h-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 truncate">{email.from}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(email.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    );
  };
  
  // Render email detail
  const renderEmailDetail = () => {
    if (!selectedEmail) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Select an email to view</p>
        </div>
      );
    }
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <button 
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg mb-4"
            onClick={() => setSelectedEmail(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold mb-4 flex-grow">{selectedEmail.subject}</h2>
          <div className="flex space-x-2">
            <button 
              className="p-2 hover:bg-gray-800 rounded-lg"
              onClick={() => toggleStar(selectedEmail.id)}
            >
              <Star className={`w-5 h-5 ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>
            <button 
              className="p-2 hover:bg-gray-800 rounded-lg"
              onClick={() => moveToFolder(selectedEmail.id, 'archive')}
            >
              <Archive className="w-5 h-5" />
            </button>
            <button 
              className="p-2 hover:bg-gray-800 rounded-lg"
              onClick={() => moveToFolder(selectedEmail.id, 'trash')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-400">From: {selectedEmail.from}</p>
        <p className="mt-2 text-sm text-gray-400">
          Date: {new Date(selectedEmail.date).toLocaleString()}
        </p>
        <div className="mt-6 prose prose-invert">
          {selectedEmail.body.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="mt-6 border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium mb-2">Attachments</h3>
            <div className="flex flex-wrap gap-2">
              {selectedEmail.attachments.map((attachment, i) => (
                <div key={i} className="px-3 py-2 bg-gray-800 rounded text-sm">
                  {attachment}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render compose modal
  const renderComposeModal = () => {
    if (!showComposeModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <h2 className="text-lg font-semibold">Compose Email</h2>
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => setShowComposeModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">To</label>
              <input
                type="email"
                className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                value={composeData.to}
                onChange={(e) => setComposeData({
                  ...composeData,
                  to: e.target.value
                })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
              <input
                type="text"
                className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                value={composeData.subject}
                onChange={(e) => setComposeData({
                  ...composeData,
                  subject: e.target.value
                })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
              <textarea
                className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white min-h-[200px]"
                value={composeData.body}
                onChange={(e) => setComposeData({
                  ...composeData,
                  body: e.target.value
                })}
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={sendEmail}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Main component render
  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-lg h-full flex flex-col">
      {error && (
        <div className="bg-red-800 text-white p-3 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span>{error}</span>
          <button 
            className="ml-auto text-white" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">Email Management</h1>
        <button
          className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center"
          onClick={() => setShowComposeModal(true)}
        >
          <Send className="mr-2 h-4 w-4" />
          Compose
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search emails..."
            className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="flex flex-grow overflow-hidden">
        <div className="w-64 border-r border-gray-800 flex flex-col">
          <div className="p-4 space-y-2">
            <button
              className={`flex items-center w-full p-2 rounded-lg ${currentFolder === 'inbox' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              onClick={() => handleFolderChange('inbox')}
            >
              <Inbox className="mr-2 h-5 w-5" />
              Inbox
              <span className="ml-auto bg-gray-700 text-xs px-2 py-1 rounded">
                {counts.inbox}
              </span>
            </button>
            <button
              className={`flex items-center w-full p-2 rounded-lg ${currentFolder === 'starred' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              onClick={() => handleFolderChange('starred')}
            >
              <Star className="mr-2 h-5 w-5" />
              Starred
              <span className="ml-auto bg-gray-700 text-xs px-2 py-1 rounded">
                {counts.starred}
              </span>
            </button>
            <button
              className={`flex items-center w-full p-2 rounded-lg ${currentFolder === 'sent' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              onClick={() => handleFolderChange('sent')}
            >
              <Send className="mr-2 h-5 w-5" />
              Sent
              <span className="ml-auto bg-gray-700 text-xs px-2 py-1 rounded">
                {counts.sent}
              </span>
            </button>
            <button
              className={`flex items-center w-full p-2 rounded-lg ${currentFolder === 'archive' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              onClick={() => handleFolderChange('archive')}
            >
              <Archive className="mr-2 h-5 w-5" />
              Archive
              <span className="ml-auto bg-gray-700 text-xs px-2 py-1 rounded">
                {counts.archive}
              </span>
            </button>
            <button
              className={`flex items-center w-full p-2 rounded-lg ${currentFolder === 'trash' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              onClick={() => handleFolderChange('trash')}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Trash
              <span className="ml-auto bg-gray-700 text-xs px-2 py-1 rounded">
                {counts.trash}
              </span>
            </button>
          </div>
          <div className="mt-auto p-4">
            <button
              className="flex items-center w-full p-2 text-gray-400 hover:text-white"
              onClick={fetchEmails}
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {renderEmailList()}
        </div>
        
        <div className="w-0 md:w-1/2 border-l border-gray-800 hidden md:block overflow-auto">
          {renderEmailDetail()}
        </div>
      </div>
      
      {renderComposeModal()}
    </div>
  );
};

export default EmailManagement;
