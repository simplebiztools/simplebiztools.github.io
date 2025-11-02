// Initialize Supabase
const supabaseUrl = 'https://tbrafvmlpridqosgrosy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicmFmdm1scHJpZHFvc2dyb3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDI1MjMsImV4cCI6MjA3NzU3ODUyM30.rIh2mIEDKBJqmiV8Q3U71_YCYM-WJ_4xcdx_bcQw1NU';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Track free uses in localStorage
function getFreeUses(toolName) {
    const uses = localStorage.getItem(`free_uses_${toolName}`);
    return uses ? parseInt(uses) : 0;
}

function incrementFreeUses(toolName) {
    const currentUses = getFreeUses(toolName);
    localStorage.setItem(`free_uses_${toolName}`, currentUses + 1);
    return currentUses + 1;
}

// Check if user has access to a tool
async function checkToolAccess(toolName) {
    try {
        // Check if user is logged in
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // User is logged in - check if they have purchased access
            const { data: purchases, error } = await supabaseClient
                .from('user_purchases')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .or(`plan_type.eq.lifetime,plan_type.eq.full_suite,and(plan_type.eq.individual_tool,tool_name.eq.${toolName})`);
            
            if (error) throw error;
            
            if (purchases && purchases.length > 0) {
                return { hasAccess: true, reason: 'paid' };
            }
        }
        
        // User not logged in or no purchase - check free uses
        const freeUses = getFreeUses(toolName);
        
        if (freeUses < 4) {
            return { 
                hasAccess: true, 
                reason: 'free_trial', 
                usesRemaining: 4 - freeUses
            };
        }
        
        // No access - exceeded free uses
        return { hasAccess: false, reason: 'limit_reached' };
        
    } catch (error) {
        console.error('Error checking access:', error);
        return { hasAccess: false, reason: 'error' };
    }
}

// Show upgrade modal
function showUpgradeModal(toolName, usesRemaining = null) {
    // Remove any existing modals first
    const existingModal = document.getElementById('upgrade-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div id="upgrade-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div id="modal-content" style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                max-width: 500px;
                text-align: center;
                position: relative;
            ">
                <button onclick="document.getElementById('upgrade-modal').remove()" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #718096;
                ">×</button>
                <h2 style="color: #2d3748; margin-bottom: 20px;">
                    ${usesRemaining !== null ? `${usesRemaining} Free Uses Remaining` : 'Upgrade to Continue'}
                </h2>
                <p style="color: #718096; font-size: 1.1em; margin-bottom: 30px;">
                    ${usesRemaining !== null 
                        ? `You have ${usesRemaining} free uses left for this tool. Upgrade for unlimited access!`
                        : 'You\'ve used all your free tries. Upgrade to continue using this tool.'
                    }
                </p>
                <div style="display: flex; gap: 15px; flex-direction: column;">
                    <a href="https://www.paypal.com/ncp/payment/K53FU4G4SCYBN" target="_blank" style="
                        display: block;
                        padding: 15px 30px;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 1.1em;
                    ">Get Lifetime Access - $299</a>
                    <a href="index.html#pricing" style="
                        display: block;
                        padding: 15px 30px;
                        background: #e2e8f0;
                        color: #2d3748;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                    ">View All Plans</a>
                    ${usesRemaining !== null ? `
                        <button onclick="document.getElementById('upgrade-modal').remove()" style="
                            padding: 10px;
                            background: none;
                            border: none;
                            color: #718096;
                            cursor: pointer;
                            text-decoration: underline;
                        ">Continue with free trial</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add click listener to close on background click
    setTimeout(() => {
        const modal = document.getElementById('upgrade-modal');
        const modalContent = document.getElementById('modal-content');
        
        if (modal && modalContent) {
            modal.addEventListener('click', function(e) {
                // Close if clicked outside modal content
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    }, 100);
}

// Add login/account button to header
async function addAuthButton() {
    console.log('addAuthButton called');
    
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    console.log('Session check:', session);
    console.log('Error:', error);
    
    const header = document.querySelector('header .container');
    if (!header) {
        console.log('Header not found');
        return;
    }
    
    // Remove existing auth button if present
    const existingAuthButton = header.querySelector('.auth-button-container');
    if (existingAuthButton) {
        existingAuthButton.remove();
    }
    
    const authButton = document.createElement('div');
    authButton.className = 'auth-button-container';
    authButton.style.cssText = 'position: absolute; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 1000;';
    
    if (session) {
        console.log('User is logged in, showing account buttons');
        authButton.innerHTML = `
            <a href="account.html" style="
                padding: 10px 20px;
                background: white;
                color: #667eea;
                border: 2px solid white;
                border-radius: 6px;
                font-weight: 600;
                text-decoration: none;
                display: inline-block;
            ">My Account</a>
            <button onclick="handleLogout()" style="
                padding: 10px 20px;
                background: transparent;
                color: white;
                border: 2px solid white;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
            ">Sign Out</button>
        `;
    } else {
        console.log('User is not logged in, showing sign in button');
        authButton.innerHTML = `
            <a href="auth.html" style="
                padding: 10px 20px;
                background: white;
                color: #667eea;
                border: 2px solid white;
                border-radius: 6px;
                font-weight: 600;
                text-decoration: none;
                display: inline-block;
            ">Sign In</a>
        `;
    }
    
    header.style.position = 'relative';
    header.appendChild(authButton);
    console.log('Auth button added to header');
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Initialize auth button on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, calling addAuthButton');
    setTimeout(addAuthButton, 100);
});

// Also listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setTimeout(addAuthButton, 100);
    }
});
