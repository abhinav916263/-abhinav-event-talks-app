// State Management
let releaseNotes = [];
let activeTypeFilter = 'all';
let searchQuery = '';
let selectedUpdate = null;

// Progress Ring Configuration
const ringCircle = document.getElementById('progress-ring-circle');
const circumference = 2 * Math.PI * 10; // r=10

if (ringCircle) {
    ringCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    ringCircle.style.strokeDashoffset = circumference;
}

// DOM Elements
const timeline = document.getElementById('timeline');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const retryBtn = document.getElementById('retry-btn');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');

// Stats Elements
const statDays = document.getElementById('stat-days');
const statUpdates = document.getElementById('stat-updates');
const statTime = document.getElementById('stat-time');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const tweetSubmitBtn = document.getElementById('tweet-submit-btn');

// Modal Preview Elements
const previewBadge = document.getElementById('preview-badge');
const previewDate = document.getElementById('preview-date');
const previewSnippet = document.getElementById('preview-snippet');
const previewLink = document.getElementById('preview-link');

// Toast Element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes(true);
    setupEventListeners();
});

// Fetch Feed
async function fetchReleaseNotes(isInitialLoad = false) {
    showLoading();
    
    if (refreshIcon) {
        refreshIcon.classList.add('spinning');
    }
    if (refreshBtn) {
        refreshBtn.disabled = true;
    }

    try {
        const response = await fetch('/api/updates' + (isInitialLoad ? '' : '?refresh=true'));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.status === 'success') {
            releaseNotes = result.data;
            updateStats(releaseNotes);
            renderTimeline();
            if (result.fallback) {
                showToast(result.message);
            } else if (!isInitialLoad) {
                showToast('Feed refreshed successfully!');
            }
        } else {
            throw new Error(result.message || 'Failed to fetch release notes.');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message);
    } finally {
        if (refreshIcon) {
            refreshIcon.classList.remove('spinning');
        }
        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
}

// Update Dashboard Statistics
function updateStats(data) {
    if (statDays) {
        statDays.textContent = data.length;
    }
    
    let totalUpdates = 0;
    data.forEach(day => {
        totalUpdates += day.updates.length;
    });
    
    if (statUpdates) {
        statUpdates.textContent = totalUpdates;
    }
    
    if (statTime) {
        const now = new Date();
        statTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// Render Timeline with Filters and Search applied
function renderTimeline() {
    hideLoading();
    hideError();
    
    // Clear current timeline
    timeline.innerHTML = '';
    
    let filteredCount = 0;
    
    releaseNotes.forEach(day => {
        // Filter the updates in this day
        const matchedUpdates = day.updates.filter(update => {
            // 1. Filter by badge type
            const matchesType = activeTypeFilter === 'all' || 
                                update.type.toLowerCase() === activeTypeFilter.toLowerCase();
            
            // 2. Filter by search text (query matches date, type, or content)
            const query = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || 
                                  day.date.toLowerCase().includes(query) || 
                                  update.type.toLowerCase().includes(query) || 
                                  update.text.toLowerCase().includes(query);
            
            return matchesType && matchesSearch;
        });

        if (matchedUpdates.length > 0) {
            filteredCount += matchedUpdates.length;
            
            // Create day group
            const dayGroup = document.createElement('div');
            dayGroup.className = 'day-group';
            
            // Create day header HTML
            let dayHeaderHTML = `
                <div class="day-group-header">
                    <span class="day-date">${day.date}</span>
                    <a href="${day.link}" target="_blank" class="day-link" title="Open official release notes">
                        <svg class="day-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        <span>Official Notes</span>
                    </a>
                </div>
            `;
            dayGroup.innerHTML = dayHeaderHTML;
            
            // Create container for updates
            const updatesList = document.createElement('div');
            updatesList.className = 'day-updates-list';
            
            matchedUpdates.forEach(update => {
                const card = document.createElement('div');
                card.className = `update-item type-${update.type.toLowerCase()}`;
                
                // Add unique click interaction and layout with Copy and Tweet buttons
                card.innerHTML = `
                    <div class="update-item-header">
                        <span class="type-badge">${update.type}</span>
                        <div class="update-card-actions">
                            <button class="btn-copy-action" title="Copy clean update text to clipboard">
                                <svg class="btn-copy-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span>Copy</span>
                            </button>
                            <button class="btn-tweet-action" data-date="${day.date}" data-link="${day.link}" data-type="${update.type}">
                                <svg class="btn-tweet-action-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                <span>Tweet</span>
                            </button>
                        </div>
                    </div>
                    <div class="update-item-body">
                        ${update.html}
                    </div>
                `;
                
                // Add click listener to the Copy button
                const copyBtn = card.querySelector('.btn-copy-action');
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const textToCopy = `📢 BigQuery Update (${day.date})\n[${update.type}] ${update.text}\n\nRead more: ${day.link}`;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        showToast('Update copied to clipboard!');
                    }).catch(err => {
                        console.error('Copy failed', err);
                        showToast('Failed to copy text.');
                    });
                });
                
                // Add click listener to the Tweet button
                const tweetBtn = card.querySelector('.btn-tweet-action');
                tweetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openTweetComposer(day.date, day.link, update);
                });
                
                updatesList.appendChild(card);
            });
            
            dayGroup.appendChild(updatesList);
            timeline.appendChild(dayGroup);
        }
    });
    
    // Check if timeline is empty
    if (filteredCount === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// Open Tweet Modal with populated text
function openTweetComposer(date, link, update) {
    selectedUpdate = { date, link, update };
    
    // Format a tweet text under 280 characters
    // Twitter/X handles links as 23 characters.
    // Let's truncate plain text snippet to fit:
    // "📢 BigQuery (Date)\n[Type] TextSnippet...\nLink"
    const prefix = `📢 BigQuery Update (${date})\n[${update.type}] `;
    const suffix = `\n\nRead more: ${link}`;
    
    // Max characters = 280 - (prefix length) - (X URL length = 23) - (suffix formatting length)
    // Safe text length: 280 - prefix.length - 23 - 12 (approx. overhead for link and spacing)
    const urlOvehead = 23;
    const overhead = prefix.length + urlOvehead + 15; // padding for safety
    const maxSnippetLength = Math.max(100, 280 - overhead);
    
    let snippet = update.text;
    if (snippet.length > maxSnippetLength) {
        snippet = snippet.substring(0, maxSnippetLength - 3) + '...';
    }
    
    const defaultTweetText = `${prefix}${snippet}${suffix}`;
    
    // Populate modal inputs
    tweetTextarea.value = defaultTweetText;
    
    // Populate card preview inside modal
    if (previewBadge) {
        previewBadge.textContent = update.type;
        // set color based on class
        previewBadge.style.color = `var(--color-${update.type.toLowerCase()}, var(--color-general))`;
    }
    if (previewDate) {
        previewDate.textContent = date;
    }
    if (previewSnippet) {
        previewSnippet.textContent = update.text;
    }
    if (previewLink) {
        previewLink.textContent = link.replace('https://', '');
    }
    
    updateCharacterCount();
    
    // Show Modal
    tweetModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
    
    // Auto-focus textarea
    setTimeout(() => tweetTextarea.focus(), 100);
}

// Close Tweet Modal
function closeTweetComposer() {
    tweetModal.classList.remove('active');
    document.body.style.overflow = ''; // restore scrolling
    selectedUpdate = null;
}

// Update character counter and progress ring
function updateCharacterCount() {
    const text = tweetTextarea.value;
    
    // X handles any URL as 23 characters. Let's calculate the length accurately:
    // Find all urls in the text and replace their length with 23.
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    let textLengthWithoutUrls = text.replace(urlRegex, '');
    let calculatedLength = textLengthWithoutUrls.length + (urls.length * 23);
    
    const charsRemaining = 280 - calculatedLength;
    
    charCount.textContent = charsRemaining;
    
    // Progress Circle
    const percentage = Math.min(100, (calculatedLength / 280) * 100);
    const offset = circumference - (percentage / 100) * circumference;
    
    if (ringCircle) {
        ringCircle.style.strokeDashoffset = offset;
        
        // Color changes depending on limit
        if (charsRemaining <= 0) {
            ringCircle.style.stroke = '#f43f5e'; // Red
            charCount.style.color = '#f43f5e';
            tweetSubmitBtn.disabled = true;
        } else if (charsRemaining <= 20) {
            ringCircle.style.stroke = '#f59e0b'; // Orange
            charCount.style.color = '#f59e0b';
            tweetSubmitBtn.disabled = false;
        } else {
            ringCircle.style.stroke = '#38bdf8'; // Blue
            charCount.style.color = 'var(--text-secondary)';
            tweetSubmitBtn.disabled = false;
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh & Retry Action
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => fetchReleaseNotes(false));
    }
    if (retryBtn) {
        retryBtn.addEventListener('click', () => fetchReleaseNotes(false));
    }
    
    // Search Filter Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTimeline();
        });
    }
    
    // Category Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.currentTarget.classList.add('active');
            
            activeTypeFilter = e.currentTarget.dataset.type;
            renderTimeline();
        });
    });
    
    // Close Modal Events
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeTweetComposer);
    }
    
    // Click outside modal to close
    if (tweetModal) {
        tweetModal.addEventListener('click', (e) => {
            if (e.target === tweetModal) {
                closeTweetComposer();
            }
        });
    }
    
    // Textarea input event for Twitter limits
    if (tweetTextarea) {
        tweetTextarea.addEventListener('input', updateCharacterCount);
    }
    
    // Tweet submit action
    if (tweetSubmitBtn) {
        tweetSubmitBtn.addEventListener('click', () => {
            const tweetText = tweetTextarea.value;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            
            // Open X/Twitter Intent
            window.open(twitterUrl, '_blank');
            
            closeTweetComposer();
            showToast('Twitter window opened!');
        });
    }
    
    // Copy draft action
    const copyDraftBtn = document.getElementById('copy-draft-btn');
    if (copyDraftBtn) {
        copyDraftBtn.addEventListener('click', () => {
            const draftText = tweetTextarea.value;
            navigator.clipboard.writeText(draftText).then(() => {
                showToast('Draft copied to clipboard!');
            }).catch(err => {
                console.error('Copy failed', err);
                showToast('Failed to copy draft.');
            });
        });
    }
}

// Show/Hide Helpers for states
function showLoading() {
    loadingState.classList.remove('hidden');
    timeline.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
    timeline.classList.remove('hidden');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    timeline.classList.add('hidden');
    errorState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    if (errorMessage) {
        errorMessage.textContent = msg;
    }
}

function hideError() {
    errorState.classList.add('hidden');
}

// Show Toast Alerts
function showToast(message) {
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 2500);
    }
}
