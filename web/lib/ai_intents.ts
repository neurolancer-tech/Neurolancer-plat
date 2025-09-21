import api from './api';
import { getProfile, getUser } from './auth';

export interface ActionCard {
  title: string;
  description: string;
  action: string;
  icon: string;
  color: string;
}

export interface AIIntentContext {
  origin: 'floating' | 'messages';
}

export interface AIIntentResult {
  handled: boolean;
  message?: string;
  actionCards?: ActionCard[];
  navigateTo?: string;
  openForm?: { id: string; prefill?: Record<string, any> };
}

const statusMap: Record<string, string> = {
  'pending': 'pending',
  'accepted': 'accepted',
  'in progress': 'in_progress',
  'in_progress': 'in_progress',
  'delivered': 'delivered',
  'revision requested': 'revision_requested',
  'completed': 'completed',
  'cancelled': 'cancelled',
};

function parseOrderId(text: string): number | null {
  const m = text.match(/order\s*(#|no\.|id\s*)?(\d+)/i);
  if (m && m[2]) return parseInt(m[2], 10);
  const n = text.match(/\b(\d{2,})\b/);
  return n ? parseInt(n[1], 10) : null;
}

function parseStatus(text: string): string | null {
  const keys = Object.keys(statusMap);
  const found = keys.find(k => text.toLowerCase().includes(k));
  return found ? statusMap[found] : null;
}

function toTitle(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildCardsFromList(items: any[], type: 'gig' | 'job'): ActionCard[] {
  return items.slice(0, 3).map((it: any) => ({
    title: type === 'gig' ? (it.title || 'Gig') : (it.title || 'Job'),
    description: type === 'gig' ? `From $${it.basic_price ?? ''} • ${it.category_name ?? it.category?.name ?? ''}` : `${it.experience_level ? toTitle(it.experience_level) + ' • ' : ''}${it.category_name ?? it.category?.name ?? ''}`,
    action: type === 'gig' ? `/gigs/${it.id}` : `/jobs/${it.id}`,
    icon: type === 'gig' ? '🚀' : '💼',
    color: type === 'gig' ? 'from-purple-500 to-purple-600' : 'from-blue-500 to-blue-600'
  }));
}

// Map simple natural language field names to API fields
const userProfileFieldMap: Record<string, string> = {
  'first name': 'first_name',
  'last name': 'last_name',
  'email': 'email',
  'bio': 'bio',
  'skills': 'skills',
  'hourly rate': 'hourly_rate',
  'title': 'title',
  'experience years': 'experience_years',
  'experience': 'experience_years',
  'education': 'education',
  'certifications': 'certifications',
  'languages': 'languages',
  'phone': 'phone',
  'city': 'city',
  'country': 'country',
  'website': 'website',
  'linkedin': 'linkedin',
  'github': 'github'
};

const freelancerFieldMap: Record<string, string> = {
  'portfolio url': 'portfolio_url',
  'github': 'github_url',
  'linkedin': 'linkedin_url',
  'availability': 'availability',
  'title': 'title',
  'bio': 'bio',
  'skills': 'skills',
  'hourly rate': 'hourly_rate'
};

const clientFieldMap: Record<string, string> = {
  'company name': 'company_name',
  'company size': 'company_size',
  'industry': 'industry',
  'website': 'website_url',
  'typical budget': 'typical_budget',
  'project types': 'project_types'
};

function matchField(text: string, map: Record<string, string>): { apiField: string, value: string } | null {
  // Patterns: set my X to Y, update X to Y, change X to Y, X: Y
  const lowered = text.toLowerCase();
  const patterns = [
    /set (?:my )?(.+?) to (.+)/i,
    /update (.+?) to (.+)/i,
    /change (.+?) to (.+)/i,
    /(.+?):\s*(.+)/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1] && m[2]) {
      const fieldRaw = m[1].trim().toLowerCase();
      const value = m[2].trim();
      const key = Object.keys(map).find(k => fieldRaw.includes(k));
      if (key) return { apiField: map[key], value };
    }
  }
  // Short pattern: set X Y
  const m2 = lowered.match(/set (?:my )?(.+?) (?:to )?(.+)/i);
  if (m2 && m2[1] && m2[2]) {
    const key = Object.keys(map).find(k => m2[1].trim().includes(k));
    if (key) return { apiField: map[key], value: m2[2].trim() };
  }
  return null;
}

export async function handleAIIntent(input: string, ctx: AIIntentContext): Promise<AIIntentResult> {
  const text = input.trim();
  const lower = text.toLowerCase();
  const profile = getProfile();
  const user = getUser();

  // 1) Switch role
  if (/(switch|change).*role.*(client|freelancer)|\bmake me a (client|freelancer)\b|\bi am a (client|freelancer) now\b/i.test(lower)) {
    const roleMatch = lower.match(/(client|freelancer)/i);
    const newRole = (roleMatch?.[1] || '').toLowerCase() as 'client' | 'freelancer';
    if (!newRole) return { handled: true, message: 'Please specify a role: client or freelancer.' };
    try {
      await api.patch('/profile/update/', { user_type: newRole });
      return { handled: true, message: `✅ Role updated to ${newRole}. Refreshing parts of the app will reflect the change.` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to switch role: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 2) Publish/unpublish client/freelancer profile
  if (/publish my (client|freelancer) profile/.test(lower) || /unpublish my (client|freelancer) profile/.test(lower)) {
    const isPublish = lower.includes('publish my');
    const which = lower.includes('client') ? 'client' : 'freelancer';
    try {
      if (which === 'client') {
        // Update or create client profile
        try {
          await api.put('/profiles/client/', { is_active: isPublish });
        } catch (err: any) {
          // If not exists, create it minimal then publish
          try { await api.post('/profiles/client/', { is_active: isPublish }); } catch {}
        }
      } else {
        // Freelancer: update if exists
        try {
          await api.put('/profiles/freelancer/', { is_active: isPublish });
        } catch (err: any) {
          try { await api.post('/profiles/freelancer/', { is_active: isPublish }); } catch {}
        }
      }
      return { handled: true, message: `✅ ${which.charAt(0).toUpperCase()+which.slice(1)} profile ${isPublish ? 'published' : 'unpublished'}.` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to ${isPublish ? 'publish' : 'unpublish'}: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 3) Update profile fields (role-based)
  const userField = matchField(text, userProfileFieldMap);
  const freelancerField = matchField(text, freelancerFieldMap);
  const clientField = matchField(text, clientFieldMap);
  if (userField || freelancerField || clientField) {
    try {
      if (userField) {
        const payload: any = { [userField.apiField]: userField.value };
        // numeric casts
        if (userField.apiField === 'hourly_rate' || userField.apiField === 'experience_years') {
          payload[userField.apiField] = userField.apiField === 'hourly_rate' ? parseFloat(userField.value) : parseInt(userField.value);
        }
        await api.patch('/profile/update/', payload);
      }
      if (freelancerField) {
        const payload: any = { [freelancerField.apiField]: freelancerField.value };
        try { await api.put('/profiles/freelancer/', payload); }
        catch { await api.post('/profiles/freelancer/', payload); }
      }
      if (clientField) {
        const payload: any = { [clientField.apiField]: clientField.value };
        try { await api.put('/profiles/client/', payload); }
        catch { await api.post('/profiles/client/', payload); }
      }
      return { handled: true, message: '✅ Profile updated successfully.' };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to update profile: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 3b) If asked to update profile but missing field/value, open a simple profile-update form
  if (/\b(update|edit|change) (my )?(profile|client profile|freelancer profile)\b/i.test(lower) && !(userField || freelancerField || clientField)) {
    return {
      handled: true,
      message: 'Let\'s update your profile. Choose what to change:',
      actionCards: [
        { title: 'Profile Update', description: 'Open mini form', action: 'form:profile-update', icon: '⚙️', color: 'from-teal-500 to-teal-600' }
      ],
      openForm: { id: 'profile-update' }
    };
  }

  // 4) Orders: list
  if (/\b(my orders|list orders|show orders)\b/i.test(lower)) {
    try {
      const res = await api.get('/orders/');
      const list: any[] = res.data.results || res.data || [];
      if (!list.length) return { handled: true, message: '📦 You have no orders yet.' };
      const lines = list.slice(0, 5).map((o: any) => `• #${o.id} ${o.title} — ${toTitle(o.status)} — $${o.price}`);
      return { handled: true, message: `Here are your recent orders:\n\n${lines.join('\n')}` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to fetch orders: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 5) Orders: change status
  if (/(set|change|update).*(order)/i.test(lower) && parseOrderId(lower)) {
    const orderId = parseOrderId(lower)!;
    const status = parseStatus(lower);
    if (!status) return { handled: true, message: 'Please specify a valid status (accepted, in progress, delivered, completed, cancelled).' };
    try {
      await api.post(`/orders/${orderId}/update-status/`, { status });
      return { handled: true, message: `✅ Order #${orderId} status updated to ${toTitle(status)}.` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to update order #${orderId}: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 6) Release payment
  if (/release (the )?payment/.test(lower) && parseOrderId(lower)) {
    const orderId = parseOrderId(lower)!;
    try {
      await api.post('/payments/release-escrow/', { order_id: orderId });
      return { handled: true, message: `✅ Payment released for order #${orderId}.` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to release payment: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 6b) Rate freelancer
  if (/\brate (freelancer|order)\b/.test(lower)) {
    const orderId = parseOrderId(lower);
    const ratingMatch = lower.match(/(\b[1-5]\b)\s*star/);
    const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
    if (!orderId || !rating) {
      return { handled: true, message: 'Please specify the order ID and rating (1-5), e.g., "Rate freelancer for order #123, 5 stars".' };
    }
    try {
      await api.post('/reviews/create/', { order: orderId, rating, comment: 'Rated via chat' });
      return { handled: true, message: `✅ Submitted a ${rating}-star review for order #${orderId}.` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to submit review: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 7) Notifications
  if (/\b(notifications|show notifications|check notifications)\b/.test(lower)) {
    try {
      const res = await api.get('/notifications/');
      const list: any[] = res.data.results || res.data || [];
      if (!list.length) return { handled: true, message: '🔔 No notifications.' };
      const lines = list.slice(0, 5).map((n: any) => `• ${n.title}`);
      return { handled: true, message: `🔔 Recent notifications:\n\n${lines.join('\n')}` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to fetch notifications: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 8) Report creation
  if (/\breport\b/.test(lower)) {
    try {
      // Heuristic parse: "report job 123 spam" / "report user 55 harassment"
      const typeMatch = lower.match(/report\s+(gig|job|order|user|freelancer|client)/);
      const reportType = typeMatch?.[1] || 'user';
      const id = parseOrderId(lower);
      const reason = lower.replace(/.*\breport\b/i, '').replace(/(gig|job|order|user|freelancer|client)\s*#?\d+/i, '').trim() || 'User submitted report';
      const payload: any = {
        report_type: reportType === 'freelancer' || reportType === 'client' ? 'user' : reportType,
        category: 'user_report',
        title: `Report ${reportType}${id ? ' #' + id : ''}`,
        description: reason || 'User submitted report'
      };
      if (reportType === 'gig' && id) payload.gig_id = id;
      if (reportType === 'job' && id) payload.job_id = id;
      if (reportType === 'order' && id) payload.order_id = id;
      if ((reportType === 'user' || reportType === 'freelancer' || reportType === 'client') && id) payload.user_id = id;
      await api.post('/user-reports/create/', payload);
      return { handled: true, message: '✅ Report submitted. Our team will review it shortly.' };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to submit report: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 8b) Toggle notification preferences
  if (/\b(mute notifications|disable notifications)\b/.test(lower)) {
    try {
      const categories = ['order_updates','messages','proposals','payments','system_notifications'];
      const methods = ['in_app','email'];
      const preferences = categories.flatMap(category => methods.map(delivery_method => ({ category, delivery_method, is_enabled: false, frequency: 'disabled' })));
      await api.post('/notifications/preferences/update/', { preferences });
      return { handled: true, message: '🔕 Notifications muted (in-app and email). You can re-enable them anytime.' };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to update preferences: ${e?.response?.data?.error || e.message}` };
    }
  }
  if (/\b(unmute notifications|enable notifications)\b/.test(lower)) {
    try {
      const categories = ['order_updates','messages','proposals','payments','system_notifications'];
      const methods = ['in_app','email'];
      const preferences = categories.flatMap(category => methods.map(delivery_method => ({ category, delivery_method, is_enabled: true, frequency: 'instant' })));
      await api.post('/notifications/preferences/update/', { preferences });
      return { handled: true, message: '🔔 Notifications enabled (in-app and email set to instant).' };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to update preferences: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 9) Support ticket / feedback
  if (/\b(ticket|support|help)\b/.test(lower) || /\bfeedback\b/.test(lower)) {
    try {
      // Simple parse: "open ticket: subject - description" or take whole input
      const m = text.match(/ticket[:\-]\s*(.+)/i);
      const subject = m?.[1]?.slice(0, 80) || 'Support Request';
      const desc = text.length > 30 ? text : 'User requested support via AI chatbot.';
      await api.post('/tickets/', {
        subject,
        description: desc,
        category: /feedback/.test(lower) ? 'feedback' : 'support',
        priority: 'medium'
      });
      return { handled: true, message: '✅ Support ticket created. We will get back to you shortly.' };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to create ticket: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 9b) Add/upload document (open upload form)
  if (/(add|upload).*document/.test(lower)) {
    return {
      handled: true,
      message: 'Let\'s upload a document to your profile.',
      actionCards: [ { title: 'Upload Document', description: 'Add a CV, certificate, or portfolio', action: 'form:document-upload', icon: '📄', color: 'from-indigo-500 to-indigo-600' } ],
      openForm: { id: 'document-upload' }
    };
  }

  // 10) Recommend gigs/jobs (search)
  if (/\b(recommend|find|search)\b.*\bgigs?\b/.test(lower)) {
    try {
      const qMatch = text.match(/gigs? (?:about|for|on) (.+)/i) || text.match(/gigs?:\s*(.+)/i);
      const q = qMatch?.[1] || text.replace(/.*gigs?\b/i, '').trim();
      const res = await api.get('/gigs/search/', { params: { q } });
      const list: any[] = res.data.results || res.data || [];
      if (!list.length) return { handled: true, message: `No gigs found for "${q}".` };
      return { handled: true, message: `Here are some gigs for "${q}":`, actionCards: buildCardsFromList(list, 'gig') };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to search gigs: ${e?.response?.data?.error || e.message}` };
    }
  }
  if (/\b(recommend|find|search)\b.*\bjobs?\b/.test(lower)) {
    try {
      const qMatch = text.match(/jobs? (?:about|for|on) (.+)/i) || text.match(/jobs?:\s*(.+)/i);
      const q = qMatch?.[1] || text.replace(/.*jobs?\b/i, '').trim();
      const res = await api.get('/jobs/search/', { params: { q } });
      const list: any[] = res.data.results || res.data || [];
      if (!list.length) return { handled: true, message: `No jobs found for "${q}".` };
      return { handled: true, message: `Here are some jobs for "${q}":`, actionCards: buildCardsFromList(list, 'job') };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to search jobs: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 11) Groups: discover, join, create
  if (/\b(discover|list) groups\b/.test(lower)) {
    try {
      const res = await api.get('/groups/discover/');
      const groups: any[] = res.data.results || res.data || [];
      if (!groups.length) return { handled: true, message: 'No groups found.' };
      const cards: ActionCard[] = groups.slice(0, 3).map((g: any) => ({
        title: g.name || 'Group',
        description: g.group_info?.description || 'Group',
        action: `/messages?conversation=${g.id}`,
        icon: '👥',
        color: 'from-indigo-500 to-indigo-600'
      }));
      return { handled: true, message: 'Here are some groups you can join:', actionCards: cards };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to load groups: ${e?.response?.data?.error || e.message}` };
    }
  }
  if (/\bjoin group\b/.test(lower)) {
    const id = parseOrderId(lower);
    if (!id) return { handled: true, message: 'Please specify a group ID to join.' };
    try {
      await api.post(`/groups/${id}/join/`);
      return { handled: true, message: `✅ Joined group #${id}.`, navigateTo: `/messages?conversation=${id}` };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to join group: ${e?.response?.data?.error || e.message}` };
    }
  }
  if (/\bcreate group\b/.test(lower)) {
    const nameMatch = text.match(/create group\s+(.+)/i);
    const name = (nameMatch?.[1] || 'New Group').slice(0, 80);
    try {
      const res = await api.post('/conversations/group/create/', { name, group_type: 'public', is_discoverable: true });
      const id = res.data?.id || res.data?.conversation?.id;
      return { handled: true, message: `✅ Group "${name}" created.`, navigateTo: id ? `/messages?conversation=${id}` : undefined };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to create group: ${e?.response?.data?.error || e.message}` };
    }
  }

  // 12) Find user & start conversation
  if (/\bfind user\b/.test(lower)) {
    try {
      const nameMatch = text.match(/find user\s+(.+)/i);
      const q = (nameMatch?.[1] || '').trim();
      // Try freelancers search
      const res = await api.get('/freelancers/', { params: { search: q } });
      const list: any[] = res.data.results || res.data || [];
      if (!list.length) return { handled: true, message: `No matching users found for "${q}".` };
      const cards: ActionCard[] = list.slice(0, 3).map((u: any) => ({
        title: `${u.user?.first_name || ''} ${u.user?.last_name || ''}`.trim() || u.user?.username || 'User',
        description: u.title || u.bio || 'View profile',
        action: `/freelancer/${u.user?.id}`,
        icon: '👤',
        color: 'from-green-500 to-green-600'
      }));
      return { handled: true, message: 'I found these users:', actionCards: cards };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to search users: ${e?.response?.data?.error || e.message}` };
    }
  }
  if (/\b(start|begin|open) (a )?(chat|conversation) with user\b/.test(lower)) {
    const id = parseOrderId(lower);
    if (!id) return { handled: true, message: 'Please specify a numeric user ID.' };
    try {
      const res = await api.post('/conversations/direct/start/', { user_id: id });
      const convId = res.data?.id || res.data?.conversation?.id;
      if (convId) {
        return { handled: true, message: `✅ Conversation started with user #${id}.`, navigateTo: `/messages?conversation=${convId}` };
      }
      return { handled: true, message: '✅ Conversation created.' };
    } catch (e: any) {
      return { handled: true, message: `❌ Failed to start conversation: ${e?.response?.data?.error || e.message}` };
    }
  }

  // Not handled
  return { handled: false };
}

