// ==================================================
// ENHANCED RAISE REVIEW COMPONENT WITH COMMENTS
// ==================================================

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, Send, X, ChevronDown, ChevronUp, User, 
  Mail, Calendar, MapPin, Building, Briefcase,
  CheckCircle, AlertCircle, Clock, Filter, Search,
  SortAsc, SortDesc, RotateCcw, Plus, Minus,
  FileSignature, MessageSquare, AlertTriangle
} from 'lucide-react';
import './raiseReview.css';
import { 
  getCandidates, 
  getCandidateDetails, 
  getEmailTemplates, 
  raiseReviewRequest,
  getDropdownDataProtected as getDropdownData,
  getReviewTickets,
  getUserSignatures,
  getDefaultSignature,
  addCandidateComment,
  getCandidateComments
} from '../../services/api';
import { toast } from 'react-hot-toast';

const RaiseReview = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [defaultSignature, setDefaultSignature] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [reviewTickets, setReviewTickets] = useState([]);
  const [dropdownData, setDropdownData] = useState({
    geo_locations: [],
    business_functions: []
  });

  // Comment Modal States
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentCandidate, setCommentCandidate] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentReason, setCommentReason] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [candidateComments, setCandidateComments] = useState({});

  // Enhanced Filter and Sort States
  const [filters, setFilters] = useState({
    candidates: [],
    jobs: [],
    clients: [],
    statuses: [],
    dateRanges: [],
    searchTerm: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'priority',
    direction: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);
  
  const [formData, setFormData] = useState({
    candidate_id: '',
    geo_id: '',
    bf_id: '',
    template_id: '',
    recruiter_signature: '',
    signature_id: '',
    notes: ''
  });

  const [emailContent, setEmailContent] = useState({
    subject: '',
    body: '',
    isEdited: false
  });

  const [emailPreview, setEmailPreview] = useState({
    subject: '',
    body: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Comment reasons for dropdown
  const commentReasons = [
    { value: 'candidate_terminated', label: 'Candidate terminated early' },
    { value: 'project_cancelled', label: 'Project cancelled/on hold' },
    { value: 'candidate_declined', label: 'Candidate requested not to be contacted' },
    { value: 'client_request', label: 'Client specific request' },
    { value: 'performance_issues', label: 'Performance issues' },
    { value: 'compliance_issues', label: 'Compliance/legal issues' },
    { value: 'other', label: 'Other business reason' }
  ];

  // Get unique values for filter options
  const getFilterOptions = useMemo(() => {
    const uniqueCandidates = [...new Set(candidates.map(c => ({
      value: `${c.cfirstname || ''} ${c.clastname || ''}`.trim(),
      email: c.cemail,
      id: c.id || c.candidate_id
    }))).values()].filter(c => c.value);

    const uniqueJobs = [...new Set(candidates.map(c => 
      c.job_title_name || c.job_title || ''
    ).filter(Boolean))];

    const uniqueClients = [...new Set(candidates.map(c => 
      c.client_name || c.client || ''
    ).filter(Boolean))];

    const statusOptions = [
      { value: 'ready', label: 'Ready' },
      { value: 'sent', label: 'Review Sent' },
      { value: 'reminder', label: 'Reminder Sent' },
      { value: 'received', label: 'Review Received' },
      { value: 'completed', label: 'Completed' },
      { value: 'expired', label: 'Expired' },
      { value: 'pending', label: 'Pending' },
      { value: 'commented', label: 'Has Comments' }
    ];

    const dateRangeOptions = [
      { value: 'thisWeek', label: 'This Week' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'lastMonth', label: 'Last Month' },
      { value: 'last3Months', label: 'Last 3 Months' },
      { value: 'upcoming', label: 'Upcoming' }
    ];

    return {
      candidates: uniqueCandidates.map(c => ({ value: c.value, email: c.email, id: c.id })),
      jobs: uniqueJobs.map(j => ({ value: j, label: j })),
      clients: uniqueClients.map(c => ({ value: c, label: c })),
      statuses: statusOptions,
      dateRanges: dateRangeOptions
    };
  }, [candidates, reviewTickets, candidateComments]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.geo_id && formData.bf_id) {
      fetchEmailTemplates();
    }
  }, [formData.geo_id, formData.bf_id]);

  useEffect(() => {
    if (formData.template_id && selectedCandidate) {
      generateEmailContent();
    }
  }, [formData.template_id, selectedCandidate, formData.signature_id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.multi-select-dropdown')) {
        setActiveFilterDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      const [candidatesResponse, dropdownResponse, ticketsResponse, signaturesResponse, defaultSigResponse] = await Promise.all([
        getCandidates(),
        getDropdownData(),
        getReviewTickets(),
        getUserSignatures(),
        getDefaultSignature().catch(() => null)
      ]);

      if (candidatesResponse.success) {
        const candidatesData = candidatesResponse.data.candidates || candidatesResponse.data;
        setCandidates(candidatesData);
        
        // Fetch comments for each candidate
        const commentsPromises = candidatesData.map(async (candidate) => {
          try {
            const candidateId = candidate.id || candidate.candidate_id;
            const commentsResponse = await getCandidateComments(candidateId);
            return {
              candidateId,
              comments: commentsResponse.success ? commentsResponse.data : []
            };
          } catch (error) {
            return { candidateId: candidate.id || candidate.candidate_id, comments: [] };
          }
        });
        
        const commentsResults = await Promise.all(commentsPromises);
        const commentsMap = {};
        commentsResults.forEach(({ candidateId, comments }) => {
          commentsMap[candidateId] = comments;
        });
        setCandidateComments(commentsMap);
      } else {
        toast.error('Failed to load candidates');
      }

      if (dropdownResponse.success) {
        setDropdownData(dropdownResponse.data);
      } else {
        toast.error('Failed to load form options');
      }

      if (ticketsResponse.success) {
        setReviewTickets(ticketsResponse.data);
      } else {
        console.warn('Failed to load review tickets');
        setReviewTickets([]);
      }

      if (signaturesResponse.success) {
        setSignatures(signaturesResponse.data);
        
        if (defaultSigResponse && defaultSigResponse.success) {
          setDefaultSignature(defaultSigResponse.data);
        }
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await getEmailTemplates(formData.geo_id, formData.bf_id, 'review_request');
      if (response.success) {
        setEmailTemplates(response.data);
      } else {
        setEmailTemplates([]);
        toast.error('No email templates found for selected criteria');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setEmailTemplates([]);
    }
  };

  // Helper function to get candidate review status
  const getCandidateReviewStatus = (candidate) => {
    const candidateId = candidate.id || candidate.candidate_id;
    const ticket = reviewTickets.find(t => t.candidate_id === candidateId);
    
    if (!ticket) return null;
    
    const statusMap = {
      'email_sent': { status: 'sent', label: 'Review Sent', icon: 'fa-paper-plane', priority: 2 },
      'in_progress': { status: 'sent', label: 'Review Sent', icon: 'fa-paper-plane', priority: 2 },
      'reminder_sent': { status: 'reminder', label: 'Reminder Sent', icon: 'fa-clock', priority: 2 },
      'review_received': { status: 'received', label: 'Review Received', icon: 'fa-star', priority: 3 },
      'closed': { status: 'completed', label: 'Completed', icon: 'fa-check-circle', priority: 3 },
      'expired': { status: 'expired', label: 'Expired', icon: 'fa-exclamation-triangle', priority: 3 }
    };

    return statusMap[ticket.ticket_status] || null;
  };

  // Fixed date logic: Enable only if start date is GREATER than current date
  const canRequestReview = (candidate) => {
    if (!candidate.start_date) return false;
    
    const startDate = new Date(candidate.start_date);
    const today = new Date();
    
    // Reset time to compare only dates
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const reviewStatus = getCandidateReviewStatus(candidate);
    
    // If there's already a review status, can't request again
    if (reviewStatus) return false;
    
    // Only allow if start date is AFTER today (greater than current date)
    return startDate < today;
  };

  // Check if candidate has comments (for filtering and display)
  const hasComments = (candidate) => {
    const candidateId = candidate.id || candidate.candidate_id;
    const comments = candidateComments[candidateId] || [];
    return comments.length > 0;
  };

  // Get priority for sorting
  const getCandidatePriority = (candidate) => {
    const reviewStatus = getCandidateReviewStatus(candidate);
    const canRequest = canRequestReview(candidate);
    
    if (canRequest && !reviewStatus) return 1;
    if (reviewStatus && (reviewStatus.status === 'sent' || reviewStatus.status === 'reminder')) return 2;
    if (reviewStatus && (reviewStatus.status === 'received' || reviewStatus.status === 'completed' || reviewStatus.status === 'expired')) return 3;
    return 4;
  };

  // Enhanced filtering logic with multiple selections
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const candidateName = `${candidate.cfirstname || ''} ${candidate.clastname || ''}`.trim();
      const candidateEmail = (candidate.cemail || '').toLowerCase();
      const jobTitle = (candidate.job_title_name || candidate.job_title || '').toLowerCase();
      const clientName = (candidate.client_name || candidate.client || '').toLowerCase();
      const reviewStatus = getCandidateReviewStatus(candidate);
      const canRequest = canRequestReview(candidate);
      const candidateHasComments = hasComments(candidate);

      // Global search filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchable = `${candidateName} ${candidateEmail} ${jobTitle} ${clientName}`.toLowerCase();
        if (!searchable.includes(searchTerm)) {
          return false;
        }
      }

      // Candidate filter (multiple selections)
      if (filters.candidates.length > 0) {
        const matchesCandidate = filters.candidates.some(filterCandidate => 
          candidateName.toLowerCase().includes(filterCandidate.toLowerCase()) ||
          candidateEmail.includes(filterCandidate.toLowerCase())
        );
        if (!matchesCandidate) return false;
      }

      // Job filter (multiple selections)
      if (filters.jobs.length > 0) {
        const matchesJob = filters.jobs.some(job => 
          jobTitle.includes(job.toLowerCase())
        );
        if (!matchesJob) return false;
      }

      // Client filter (multiple selections)
      if (filters.clients.length > 0) {
        const matchesClient = filters.clients.some(client => 
          clientName.includes(client.toLowerCase())
        );
        if (!matchesClient) return false;
      }

      // Status filter (multiple selections) - Enhanced with comments
      if (filters.statuses.length > 0) {
        let currentStatus = reviewStatus ? reviewStatus.status : 
                           canRequest ? 'ready' : 'pending';
        
        // Check for commented status
        if (candidateHasComments && filters.statuses.includes('commented')) {
          return true;
        }
        
        if (!filters.statuses.includes(currentStatus)) {
          return false;
        }
      }

      // Date range filter (multiple selections)
      if (filters.dateRanges.length > 0 && candidate.start_date) {
        const startDate = new Date(candidate.start_date);
        const today = new Date();
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

        const matchesDateRange = filters.dateRanges.some(range => {
          switch (range) {
            case 'thisWeek':
              return daysDiff <= 7 && daysDiff >= 0;
            case 'thisMonth':
              return daysDiff <= 30 && daysDiff >= 0;
            case 'lastMonth':
              return daysDiff <= 60 && daysDiff > 30;
            case 'last3Months':
              return daysDiff <= 90 && daysDiff >= 0;
            case 'upcoming':
              return daysDiff < 0;
            default:
              return false;
          }
        });

        if (!matchesDateRange) return false;
      }

      return true;
    });
  }, [candidates, reviewTickets, filters, candidateComments]);

  // Sort filtered candidates
  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates].sort((a, b) => {
      if (sortConfig.key === 'priority') {
        const priorityA = getCandidatePriority(a);
        const priorityB = getCandidatePriority(b);
        return sortConfig.direction === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      }

      if (sortConfig.key === 'candidate') {
        const nameA = `${a.cfirstname || ''} ${a.clastname || ''}`.trim();
        const nameB = `${b.cfirstname || ''} ${b.clastname || ''}`.trim();
        return sortConfig.direction === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }

      if (sortConfig.key === 'job') {
        const jobA = a.job_title_name || a.job_title || '';
        const jobB = b.job_title_name || b.job_title || '';
        return sortConfig.direction === 'asc' 
          ? jobA.localeCompare(jobB)
          : jobB.localeCompare(jobA);
      }

      if (sortConfig.key === 'client') {
        const clientA = a.client_name || a.client || '';
        const clientB = b.client_name || b.client || '';
        return sortConfig.direction === 'asc' 
          ? clientA.localeCompare(clientB)
          : clientB.localeCompare(clientA);
      }

      if (sortConfig.key === 'date') {
        const dateA = new Date(a.start_date || 0);
        const dateB = new Date(b.start_date || 0);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (sortConfig.key === 'status') {
        const priorityA = getCandidatePriority(a);
        const priorityB = getCandidatePriority(b);
        return sortConfig.direction === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      }

      return 0;
    });

    return sorted;
  }, [filteredCandidates, sortConfig, reviewTickets, candidateComments]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Enhanced filter handling for multiple selections
  const handleMultiSelectFilter = (filterType, value, isAdd = true) => {
    setFilters(prev => {
      const currentValues = prev[filterType] || [];
      
      if (isAdd && !currentValues.includes(value)) {
        return { ...prev, [filterType]: [...currentValues, value] };
      } else if (!isAdd) {
        return { ...prev, [filterType]: currentValues.filter(v => v !== value) };
      }
      
      return prev;
    });
  };

  // Handle search term
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      candidates: [],
      jobs: [],
      clients: [],
      statuses: [],
      dateRanges: [],
      searchTerm: ''
    });
    setSortConfig({
      key: 'priority',
      direction: 'asc'
    });
  };

  // Clear specific filter type
  const clearSpecificFilter = (filterType) => {
    setFilters(prev => ({ ...prev, [filterType]: [] }));
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <SortAsc className="w-4 h-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 text-indigo-600" /> : 
      <SortDesc className="w-4 h-4 text-indigo-600" />;
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.searchTerm || 
           filters.candidates.length > 0 || 
           filters.jobs.length > 0 || 
           filters.clients.length > 0 || 
           filters.statuses.length > 0 || 
           filters.dateRanges.length > 0 ||
           sortConfig.key !== 'priority';
  };

  // Multi-select dropdown component
  const MultiSelectDropdown = ({ 
    filterType, 
    options, 
    selectedValues, 
    placeholder, 
    icon: Icon 
  }) => {
    const isOpen = activeFilterDropdown === filterType;
    
    return (
      <div className="multi-select-dropdown">
        <div 
          className="multi-select-trigger"
          onClick={() => setActiveFilterDropdown(isOpen ? null : filterType)}
        >
          <div className="trigger-content">
            <Icon className="w-4 h-4" />
            <span>{selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          {selectedValues.length > 0 && (
            <button 
              className="clear-selection"
              onClick={(e) => {
                e.stopPropagation();
                clearSpecificFilter(filterType);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="multi-select-options">
            <div className="options-list">
              {options.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                const isSelected = selectedValues.includes(value);
                
                return (
                  <div
                    key={value}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleMultiSelectFilter(filterType, value, !isSelected)}
                  >
                    <div className="option-content">
                      {filterType === 'candidates' && option.email && (
                        <div className="candidate-option">
                          <div className="candidate-name">{label}</div>
                          <div className="candidate-email">{option.email}</div>
                        </div>
                      )}
                      {filterType !== 'candidates' && <span>{label}</span>}
                    </div>
                    <div className={`option-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <div className="options-footer">
                <button 
                  className="clear-all-btn"
                  onClick={() => clearSpecificFilter(filterType)}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleViewCandidate = async (candidate) => {
    const candidateId = candidate.id || candidate.candidate_id;
    
    if (expandedRow === candidateId) {
      setExpandedRow(null);
      return;
    }
    
    try {
      const response = await getCandidateDetails(candidateId);
      if (response.success) {
        setExpandedRow(candidateId);
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      toast.error('Failed to load candidate details');
    }
  };

  const handleCandidateSelect = async (candidate) => {
    try {
      const response = await getCandidateDetails(candidate.id || candidate.candidate_id);
      if (response.success) {
        setSelectedCandidate(response.data);
        
        // Set form data with default signature if available
        setFormData(prev => ({ 
          ...prev, 
          candidate_id: candidate.id || candidate.candidate_id,
          geo_id: response.data.geo_id || prev.geo_id,
          bf_id: currentUser.bf_id || prev.bf_id,
          signature_id: defaultSignature?.signature_id || '',
          recruiter_signature: defaultSignature?.signature_html || '',
          notes: ''
        }));
        
        setEmailContent({
          subject: '',
          body: '',
          isEdited: false
        });
        setShowEmailForm(true);
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      toast.error('Failed to load candidate details');
    }
  };

  // Comment Modal Functions
  const handleAddComment = (candidate) => {
    setCommentCandidate(candidate);
    setCommentText('');
    setCommentReason('');
    setShowCommentModal(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!commentReason) {
      toast.error('Please select a reason');
      return;
    }

    setIsAddingComment(true);

    try {
      const commentData = {
        candidate_id: commentCandidate.id || commentCandidate.candidate_id,
        comment_text: commentText.trim(),
        comment_reason: commentReason,
        comment_type: 'no_review_request'
      };

      const response = await addCandidateComment(commentData);

      if (response.success) {
        toast.success('Comment added successfully');
        
        // Update local comments state
        const candidateId = commentCandidate.id || commentCandidate.candidate_id;
        setCandidateComments(prev => ({
          ...prev,
          [candidateId]: [...(prev[candidateId] || []), response.data]
        }));
        
        setShowCommentModal(false);
        setCommentCandidate(null);
        setCommentText('');
        setCommentReason('');
      } else {
        toast.error(response.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle signature selection
    if (name === 'signature_id') {
      const selectedSignature = signatures.find(sig => sig.signature_id === parseInt(value));
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        recruiter_signature: selectedSignature ? selectedSignature.signature_html : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateEmailContent = () => {
    const template = emailTemplates.find(t => t.template_id === parseInt(formData.template_id));
    if (!template || !selectedCandidate) {
      setEmailContent({
        subject: '',
        body: '',
        isEdited: false
      });
      setEmailPreview({
        subject: '',
        body: ''
      });
      return;
    }

    const candidateName = `${selectedCandidate.cfirstname || ''} ${selectedCandidate.clastname || ''}`.trim();
    const jobTitle = selectedCandidate.job_title_name || selectedCandidate.job_title || 'N/A';
    const clientName = selectedCandidate.client_name || selectedCandidate.client || 'N/A';
    const startDate = selectedCandidate.start_date || 'N/A';
    
    let emailBody = template.template_body || '';
    let emailSubject = template.template_subject || '';

    // Get signature HTML
    const signatureHtml = formData.recruiter_signature || '';

    // Replace placeholders in body
    const bodyReplacements = {
      '{candidate_name}': candidateName,
      '{recruiter_signature}': signatureHtml,
      '{google_review_link}': template.google_review_link || '',
      '{job_title}': jobTitle,
      '{start_date}': startDate,
      '{client_name}': clientName,
      '{project_location}': selectedCandidate.project_location || 'N/A',
      '{current_date}': new Date().toLocaleDateString(),
      '{company_name}': 'VDart Inc.'
    };

    Object.entries(bodyReplacements).forEach(([placeholder, value]) => {
      emailBody = emailBody.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Replace placeholders in subject
    const subjectReplacements = {
      '{candidate_name}': candidateName,
      '{job_title}': jobTitle,
      '{company_name}': 'VDart Inc.'
    };

    Object.entries(subjectReplacements).forEach(([placeholder, value]) => {
      emailSubject = emailSubject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    setEmailContent({
      subject: emailSubject,
      body: emailBody,
      isEdited: false
    });

    setEmailPreview({
      subject: emailSubject,
      body: emailBody.replace(/\n/g, '<br>')
    });
  };

  const handleEmailSubjectChange = (e) => {
    const newSubject = e.target.value;
    setEmailContent(prev => ({
      ...prev,
      subject: newSubject,
      isEdited: true
    }));
    setEmailPreview(prev => ({
      ...prev,
      subject: newSubject
    }));
  };

  const handleEmailBodyChange = (e) => {
    const newBody = e.target.value;
    setEmailContent(prev => ({
      ...prev,
      body: newBody,
      isEdited: true
    }));
    setEmailPreview(prev => ({
      ...prev,
      body: newBody.replace(/\n/g, '<br>')
    }));
  };

  const resetToTemplate = () => {
    generateEmailContent();
    toast.success('Email reset to original template');
  };

  const handleSubmit = async () => {
    const requiredFields = ['candidate_id', 'template_id'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!emailContent.subject || !emailContent.body) {
      toast.error('Email subject and body are required');
      return;
    }

    if (!formData.signature_id && !formData.recruiter_signature) {
      toast.error('Please select a signature or enter manual signature');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        candidate_id: parseInt(formData.candidate_id),
        template_id: parseInt(formData.template_id),
        recruiter_signature: formData.recruiter_signature,
        priority: 'normal',
        notes: formData.notes || '',
        geo_id: formData.geo_id ? parseInt(formData.geo_id) : null,
        bf_id: formData.bf_id ? parseInt(formData.bf_id) : null,
        
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        is_email_edited: emailContent.isEdited
      };

      const response = await raiseReviewRequest(submitData);
      
      if (response.success) {
        toast.success(`Review request sent successfully! Ticket: ${response.data.ticket_number}`);
        
        setFormData({
          candidate_id: '',
          geo_id: '',
          bf_id: '',
          template_id: '',
          recruiter_signature: defaultSignature?.signature_html || '',
          signature_id: defaultSignature?.signature_id || '',
          notes: ''
        });
        setEmailContent({
          subject: '',
          body: '',
          isEdited: false
        });
        setSelectedCandidate(null);
        setShowEmailForm(false);
        setEmailPreview({ subject: '', body: '' });
        setEmailTemplates([]);
        
        fetchInitialData();
      } else {
        toast.error(response.message || 'Failed to send review request');
      }
    } catch (error) {
      console.error('Error sending review request:', error);
      toast.error('Failed to send review request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNearestDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate metrics for dashboard - Fixed to match corrected logic
  const totalStarts = candidates.filter(c => {
    if (!c.start_date) return false;
    const startDate = new Date(c.start_date);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return startDate < today; // Only count candidates who have already started
  }).length;
  
  const totalReviewRequested = reviewTickets.length;
  const totalReviewReceived = reviewTickets.filter(t => t.ticket_status === 'review_received').length;
  
  const upcomingCandidates = candidates.filter(c => {
    if (!c.start_date) return false;
    const startDate = new Date(c.start_date);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return startDate >= today; // Future starts (today and later)
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  
  const upcomingCount = upcomingCandidates.length;
  const nearestStartDate = upcomingCandidates.length > 0 ? upcomingCandidates[0].start_date : null;

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <i className="fas fa-sync-alt fa-spin"></i>
        </div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>Loading candidates...</span>
      </div>
    );
  }

  return (
    <div className="fullscreen-container">
      {/* Modern Header */}
     

      {/* Dashboard Cards Section */}
      <div className="dashboard-section">
        <div className="dashboard-cards">
          <div className="dashboard-card blue">
            <div className="card-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="card-content">
              <h3>{totalStarts}</h3>
              <p>TOTAL STARTS</p>
            </div>
          </div>
          
          <div className="dashboard-card green">
            <div className="card-icon">
              <i className="fas fa-paper-plane"></i>
            </div>
            <div className="card-content">
              <h3>{totalReviewRequested}</h3>
              <p>REVIEW REQUESTED</p>
            </div>
          </div>
          
          <div className="dashboard-card yellow">
            <div className="card-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="card-content">
              <h3>{totalReviewReceived}</h3>
              <p>REVIEW RECEIVED</p>
            </div>
          </div>
          
          <div className="dashboard-card teal">
            <div className="card-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="card-content">
              <h3>{upcomingCount}</h3>
              <p>UPCOMING COUNT</p>
            </div>
          </div>
          
          <div className="dashboard-card purple">
            <div className="card-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="card-content">
              <h3>{formatNearestDate(nearestStartDate)}</h3>
              <p>NEAREST START</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="filter-container">
        <div className="filter-section">
          {/* Global Search - moved to left side */}
          <div className="global-search">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search across all fields..."
                value={filters.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="global-search-input"
              />
              {filters.searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => handleSearchChange('')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter controls - moved to right side */}
          <div className="filter-header">
            <div className="filter-toggle">
              <button 
                className={`filter-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="results-count">
                Showing {sortedCandidates.length} of {candidates.length} candidates
              </div>
            </div>
            
            {hasActiveFilters() && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Advanced filter controls - appears below the main filter section */}
        {showFilters && (
          <div className="advanced-filter-controls">
            <div className="filter-grid">
              <MultiSelectDropdown
                filterType="candidates"
                options={getFilterOptions.candidates}
                selectedValues={filters.candidates}
                placeholder="Select Candidates"
                icon={User}
              />
              
              <MultiSelectDropdown
                filterType="jobs"
                options={getFilterOptions.jobs}
                selectedValues={filters.jobs}
                placeholder="Select Job Titles"
                icon={Briefcase}
              />
              
              <MultiSelectDropdown
                filterType="clients"
                options={getFilterOptions.clients}
                selectedValues={filters.clients}
                placeholder="Select Clients"
                icon={Building}
              />
              
              <MultiSelectDropdown
                filterType="statuses"
                options={getFilterOptions.statuses}
                selectedValues={filters.statuses}
                placeholder="Select Status"
                icon={CheckCircle}
              />
              
              <MultiSelectDropdown
                filterType="dateRanges"
                options={getFilterOptions.dateRanges}
                selectedValues={filters.dateRanges}
                placeholder="Select Date Ranges"
                icon={Calendar}
              />
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="active-filters">
                <span className="active-filters-label">Active Filters:</span>
                <div className="filter-tags">
                  {filters.searchTerm && (
                    <div className="filter-tag">
                      <Search className="w-3 h-3" />
                      <span>"{filters.searchTerm}"</span>
                      <button onClick={() => handleSearchChange('')}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {filters.candidates.map(candidate => (
                    <div key={candidate} className="filter-tag">
                      <User className="w-3 h-3" />
                      <span>{candidate}</span>
                      <button onClick={() => handleMultiSelectFilter('candidates', candidate, false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {filters.jobs.map(job => (
                    <div key={job} className="filter-tag">
                      <Briefcase className="w-3 h-3" />
                      <span>{job}</span>
                      <button onClick={() => handleMultiSelectFilter('jobs', job, false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {filters.clients.map(client => (
                    <div key={client} className="filter-tag">
                      <Building className="w-3 h-3" />
                      <span>{client}</span>
                      <button onClick={() => handleMultiSelectFilter('clients', client, false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {filters.statuses.map(status => (
                    <div key={status} className="filter-tag">
                      <CheckCircle className="w-3 h-3" />
                      <span>{getFilterOptions.statuses.find(s => s.value === status)?.label}</span>
                      <button onClick={() => handleMultiSelectFilter('statuses', status, false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {filters.dateRanges.map(range => (
                    <div key={range} className="filter-tag">
                      <Calendar className="w-3 h-3" />
                      <span>{getFilterOptions.dateRanges.find(r => r.value === range)?.label}</span>
                      <button onClick={() => handleMultiSelectFilter('dateRanges', range, false)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Width Data Table */}
      <div className="data-table-container">
        <div className="table-wrapper">
          <div className="table-header">
            <div className="col-candidate sortable" onClick={() => handleSort('candidate')}>
              <i className="fas fa-user"></i>
              Candidate
              {getSortIcon('candidate')}
            </div>
            <div className="col-job sortable" onClick={() => handleSort('job')}>
              <i className="fas fa-briefcase"></i>
              Job Details
              {getSortIcon('job')}
            </div>
            <div className="col-client sortable" onClick={() => handleSort('client')}>
              <i className="fas fa-building"></i>
              Client
              {getSortIcon('client')}
            </div>
            <div className="col-date sortable" onClick={() => handleSort('date')}>
              <i className="fas fa-calendar-alt"></i>
              Start Date
              {getSortIcon('date')}
            </div>
            <div className="col-status sortable" onClick={() => handleSort('status')}>
              <i className="fas fa-info-circle"></i>
              Status
              {getSortIcon('status')}
            </div>
            <div className="col-actions">
              <i className="fas fa-cogs"></i>
              Actions
            </div>
          </div>

          {sortedCandidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">
                <i className="fas fa-users fa-4x"></i>
                <div className="pulse-ring"></div>
              </div>
              <h3>{candidates.length === 0 ? 'No Candidates Found' : 'No Matching Results'}</h3>
              <p>
                {candidates.length === 0 
                  ? "You don't have any candidates assigned to you at the moment."
                  : "Try adjusting your filters to see more candidates."
                }
              </p>
              {candidates.length > 0 && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <RotateCcw className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-body">
              {sortedCandidates.map((candidate, index) => {
                const reviewStatus = getCandidateReviewStatus(candidate);
                const canRequest = canRequestReview(candidate);
                const candidateId = candidate.id || candidate.candidate_id;
                const isExpanded = expandedRow === candidateId;
                const candidateHasComments = hasComments(candidate);
                const candidateCommentsList = candidateComments[candidateId] || [];
                
                return (
                  <div key={candidateId} className="table-row-container">
                    <div className={`table-row ${isExpanded ? 'expanded' : ''}`} 
                         style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="col-candidate">
                        <div className="candidate-avatar">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="candidate-info">
                          <div className="name">
                            {candidate.full_name || `${candidate.cfirstname || ''} ${candidate.clastname || ''}`.trim()}
                            {candidateHasComments && (
                              <span className="comment-indicator" title="Has comments">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              </span>
                            )}
                          </div>
                          <div className="email">{candidate.cemail}</div>
                        </div>
                      </div>
                      
                      <div className="col-job">
                        <i className="fas fa-briefcase text-muted"></i>
                        <span>{candidate.job_title_name || candidate.job_title || 'N/A'}</span>
                      </div>
                      
                      <div className="col-client">
                        <i className="fas fa-building text-muted"></i>
                        <span>{candidate.client_name || candidate.client || 'N/A'}</span>
                      </div>
                      
                      <div className="col-date">
                        <i className="fas fa-calendar-alt text-muted"></i>
                        <span>{formatDate(candidate.start_date)}</span>
                      </div>
                      
                      <div className="col-status">
                        {reviewStatus ? (
                          <span className={`status-badge ${reviewStatus.status}`}>
                            <i className={`fas ${reviewStatus.icon}`}></i>
                            <span>{reviewStatus.label}</span>
                          </span>
                        ) : canRequest ? (
                          <span className="status-badge ready">
                            <i className="fas fa-check-circle"></i>
                            <span>Ready</span>
                          </span>
                        ) : (
                          <span className="status-badge pending">
                            <i className="fas fa-hourglass-half"></i>
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="col-actions">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewCandidate(candidate)}
                          title={isExpanded ? "Hide Details" : "View Details"}
                        >
                          <i className={`fas ${isExpanded ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                        
                        <button
                          className={`action-btn request ${!canRequest || reviewStatus ? 'disabled' : ''}`}
                          disabled={!canRequest || !!reviewStatus}
                          onClick={() => canRequest && !reviewStatus && handleCandidateSelect(candidate)}
                          title={reviewStatus ? `Review ${reviewStatus.label}` : canRequest ? "Request Review" : "Not Ready (Start date must be in the future)"}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                        
                        <button
                          className={`action-btn comment ${candidateHasComments ? 'has-comments' : ''}`}
                          onClick={() => handleAddComment(candidate)}
                          title={candidateHasComments ? `Add Comment (${candidateCommentsList.length} existing)` : "Add Comment"}
                        >
                          <i className="fas fa-comment-alt"></i>
                          {candidateHasComments && (
                            <span className="comment-count">{candidateCommentsList.length}</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Expansion */}
                    {isExpanded && (
                      <div className="row-expansion">
                        <div className="expansion-content">
                          <div className="detail-cards">
                            <div className="detail-card">
                              <div className="card-header">
                                <i className="fas fa-address-card"></i>
                                <h4>Contact Information</h4>
                              </div>
                              <div className="card-body">
                                <div className="info-row">
                                  <i className="fas fa-user info-icon"></i>
                                  <span><strong>Name:</strong> {candidate.cfirstname} {candidate.clastname}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-envelope info-icon"></i>
                                  <span><strong>Email:</strong> {candidate.cemail}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-phone info-icon"></i>
                                  <span><strong>Phone:</strong> {candidate.phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="detail-card">
                              <div className="card-header">
                                <i className="fas fa-briefcase"></i>
                                <h4>Job Information</h4>
                              </div>
                              <div className="card-body">
                                <div className="info-row">
                                  <i className="fas fa-id-badge info-icon"></i>
                                  <span><strong>Position:</strong> {candidate.job_title_name || candidate.job_title || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-building info-icon"></i>
                                  <span><strong>Client:</strong> {candidate.client_name || candidate.client || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-calendar-check info-icon"></i>
                                  <span><strong>Start Date:</strong> {formatDate(candidate.start_date)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="detail-card">
                              <div className="card-header">
                                <i className="fas fa-map-marker-alt"></i>
                                <h4>Location Details</h4>
                              </div>
                              <div className="card-body">
                                <div className="info-row">
                                  <i className="fas fa-globe info-icon"></i>
                                  <span><strong>Geography:</strong> {candidate.geo_name || candidate.geo || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                  <i className="fas fa-map-pin info-icon"></i>
                                  <span><strong>Project Location:</strong> {candidate.project_location || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Comments Section */}
                            {candidateHasComments && (
                              <div className="detail-card comments-card">
                                <div className="card-header">
                                  <i className="fas fa-comments"></i>
                                  <h4>Comments ({candidateCommentsList.length})</h4>
                                </div>
                                <div className="card-body">
                                  {candidateCommentsList.map((comment, idx) => (
                                    <div key={comment.comment_id || idx} className="comment-item">
                                      <div className="comment-header">
                                        <div className="comment-reason">
                                          <i className="fas fa-tag"></i>
                                          <span>{commentReasons.find(r => r.value === comment.comment_reason)?.label || comment.comment_reason}</span>
                                        </div>
                                        <div className="comment-date">
                                          {formatDate(comment.created_at)}
                                        </div>
                                      </div>
                                      <div className="comment-text">
                                        {comment.comment_text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && commentCandidate && (
        <div className="modal-overlay">
          <div className="comment-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-comment-alt"></i>
                Add Comment for {commentCandidate.cfirstname} {commentCandidate.clastname}
              </h3>
              <button className="close-btn" onClick={() => setShowCommentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="comment-form">
                <div className="form-section">
                  <label>
                    Reason for not requesting review *
                    <select 
                      value={commentReason} 
                      onChange={(e) => setCommentReason(e.target.value)}
                      required
                    >
                      <option value="">Select a reason</option>
                      {commentReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Additional Details *
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Please provide specific details about why a review was not requested for this candidate..."
                      rows="4"
                      required
                    />
                  </label>

                  <div className="comment-info">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p>This comment will help track why certain candidates don't have review requests and ensure compliance with company policies.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowCommentModal(false)}
                disabled={isAddingComment}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className={`btn-primary ${isAddingComment || !commentText.trim() || !commentReason ? 'disabled' : ''}`}
                onClick={handleSubmitComment}
                disabled={isAddingComment || !commentText.trim() || !commentReason}
              >
                {isAddingComment ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-comment-alt"></i>
                    Add Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Email Form Modal with Signature Integration */}
      {showEmailForm && (
        <div className="modal-overlay">
          <div className="email-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-envelope"></i>
                Send Review Request
              </h3>
              <button className="close-btn" onClick={() => setShowEmailForm(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {selectedCandidate && (
                <div className="selected-candidate">
                  <div className="candidate-card">
                    <div className="candidate-avatar">
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <div className="candidate-details">
                      <h4>{selectedCandidate.cfirstname} {selectedCandidate.clastname}</h4>
                      <p>{selectedCandidate.cemail}</p>
                      <span className="job-title">{selectedCandidate.job_title_name || selectedCandidate.job_title}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-section">
                  <h4>
                    <i className="fas fa-cog"></i>
                    Configuration
                  </h4>
                  <div className="form-fields">
                    <label>
                      Geographic Location *
                      <select name="geo_id" value={formData.geo_id} onChange={handleFormChange} required>
                        <option value="">Select Location</option>
                        {dropdownData.geo_locations.map(location => (
                          <option key={location.geo_id} value={location.geo_id}>
                            {location.geo_name} ({location.geo_code})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Business Function *
                      <select name="bf_id" value={formData.bf_id} onChange={handleFormChange} required>
                        <option value="">Select Function</option>
                        {dropdownData.business_functions.map(func => (
                          <option key={func.bf_id} value={func.bf_id}>
                            {func.bf_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Email Template *
                      <select name="template_id" value={formData.template_id} onChange={handleFormChange} required disabled={emailTemplates.length === 0}>
                        <option value="">Select Template</option>
                        {emailTemplates.map(template => (
                          <option key={template.template_id} value={template.template_id}>
                            {template.template_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="signature-icon">
                        <FileSignature size={16} />
                        Email Signature *
                      </span>
                      <div className="signature-selection">
                        <select 
                          name="signature_id" 
                          value={formData.signature_id} 
                          onChange={handleFormChange}
                          className="signature-dropdown"
                        >
                          <option value="">Select Signature</option>
                          {signatures.map(signature => (
                            <option key={signature.signature_id} value={signature.signature_id}>
                              {signature.signature_name} {signature.is_default ? '(Default)' : ''}
                            </option>
                          ))}
                        </select>
                        
                        {formData.signature_id && (
                          <div className="signature-preview-small">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: signatures.find(s => s.signature_id === parseInt(formData.signature_id))?.signature_html || '' 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </label>

                    <label>
                      Manual Signature (if no signature selected above)
                      <textarea
                        name="recruiter_signature"
                        value={formData.recruiter_signature}
                        onChange={handleFormChange}
                        placeholder="Your manual signature (optional if signature selected above)"
                        rows="3"
                        disabled={!!formData.signature_id}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <i className="fas fa-edit"></i>
                    Email Content
                  </h4>
                  <div className="form-fields">
                    <label>
                      Subject *
                      <input
                        type="text"
                        value={emailContent.subject}
                        onChange={handleEmailSubjectChange}
                        placeholder="Email subject"
                        required
                      />
                    </label>
                    
                    <label>
                      Body *
                      <textarea
                        value={emailContent.body}
                        onChange={handleEmailBodyChange}
                        placeholder="Email content..."
                        rows="12"
                        required
                      />
                    </label>
                    
                    {emailContent.isEdited && (
                      <button type="button" className="reset-btn" onClick={resetToTemplate}>
                        <i className="fas fa-undo"></i>
                        Reset to Template
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEmailForm(false)} disabled={isSubmitting}>
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className={`btn-primary ${isSubmitting || !emailContent.subject || !emailContent.body ? 'disabled' : ''}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !emailContent.subject || !emailContent.body}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Review Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaiseReview;
