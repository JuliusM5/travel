import { Trip, Activity } from '../store/types';
import { formatDate } from '../utils/formatters';

export class ExportService {
  // Generate iCal format for a trip
  generateICalendar(trip: Trip): string {
    const now = new Date();
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TravelMate//Trip Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    // Add main trip event
    const uid = `${trip.id}@travelmate.app`;
    const startDate = this.formatICalDate(new Date(trip.startDate));
    const endDate = this.formatICalDate(new Date(trip.endDate));
    
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${this.formatICalDate(now)}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:✈️ ${trip.name}`,
      `LOCATION:${trip.destination}`,
      `DESCRIPTION:Trip to ${trip.destination}\\nBudget: $${trip.budget}\\nCollaborators: ${trip.collaborators.join(', ') || 'None'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );

    // Add activities as separate events
    trip.activities.forEach((activity, index) => {
      const activityDate = new Date(trip.startDate);
      activityDate.setDate(activityDate.getDate() + activity.day - 1);
      
      const [hours, minutes] = activity.time.split(':');
      activityDate.setHours(parseInt(hours), parseInt(minutes));
      
      const activityUid = `${trip.id}-activity-${activity.id}@travelmate.app`;
      
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${activityUid}`,
        `DTSTAMP:${this.formatICalDate(now)}`,
        `DTSTART:${this.formatICalDateTime(activityDate)}`,
        `DTEND:${this.formatICalDateTime(new Date(activityDate.getTime() + 2 * 60 * 60 * 1000))}`, // 2 hour duration
        `SUMMARY:${activity.title}`,
        `LOCATION:${activity.location || trip.destination}`,
        `DESCRIPTION:${activity.notes || ''}\\nCost: $${activity.cost}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
  }

  // Format date for iCal (YYYYMMDD)
  private formatICalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // Format datetime for iCal (YYYYMMDDTHHMMSSZ)
  private formatICalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  // Download iCal file
  downloadICalendar(trip: Trip): void {
    const icsContent = this.generateICalendar(trip);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.name.replace(/\s+/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate Google Calendar URL
  generateGoogleCalendarUrl(trip: Trip): string {
    const startDate = this.formatICalDate(new Date(trip.startDate));
    const endDate = new Date(trip.endDate);
    endDate.setDate(endDate.getDate() + 1); // Google Calendar needs exclusive end date
    const endDateStr = this.formatICalDate(endDate);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `✈️ ${trip.name}`,
      dates: `${startDate}/${endDateStr}`,
      location: trip.destination,
      details: `Trip to ${trip.destination}\nBudget: $${trip.budget}\nCollaborators: ${trip.collaborators.join(', ') || 'None'}`
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Generate PDF itinerary
  generatePDFItinerary(trip: Trip): string {
    // Simple HTML that can be printed to PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${trip.name} - Itinerary</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 { color: #4F46E5; margin-bottom: 10px; }
          h2 { color: #6B7280; margin-top: 30px; }
          .header {
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .info-item {
            background: #F9FAFB;
            padding: 15px;
            border-radius: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 14px;
          }
          .info-value {
            font-size: 18px;
            color: #111827;
            margin-top: 5px;
          }
          .day-section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .day-header {
            background: #4F46E5;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .activity {
            display: flex;
            gap: 20px;
            margin: 15px 0;
            padding: 15px;
            background: #F9FAFB;
            border-radius: 8px;
          }
          .activity-time {
            font-weight: 600;
            color: #4F46E5;
            min-width: 60px;
          }
          .activity-details {
            flex: 1;
          }
          .activity-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .activity-location {
            color: #6B7280;
            font-size: 14px;
          }
          .activity-notes {
            color: #6B7280;
            font-size: 14px;
            margin-top: 5px;
          }
          .activity-cost {
            font-weight: 600;
            color: #059669;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }
          @media print {
            body { padding: 0; }
            .day-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✈️ ${trip.name}</h1>
          <p style="color: #6B7280; font-size: 18px; margin: 0;">${trip.destination}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">DATES</div>
            <div class="info-value">${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">BUDGET</div>
            <div class="info-value">$${trip.budget} (Spent: $${trip.spent})</div>
          </div>
          <div class="info-item">
            <div class="info-label">DURATION</div>
            <div class="info-value">${this.getDaysBetween(trip.startDate, trip.endDate)} days</div>
          </div>
          <div class="info-item">
            <div class="info-label">TRAVELERS</div>
            <div class="info-value">${trip.collaborators.length > 0 ? trip.collaborators.join(', ') : 'Solo trip'}</div>
          </div>
        </div>
        
        <h2>📅 Daily Itinerary</h2>
        ${this.generateDailyItinerary(trip)}
        
        <div class="footer">
          <p>Generated by TravelMate on ${new Date().toLocaleDateString()}</p>
          <p>Have a wonderful trip! ✈️</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  private generateDailyItinerary(trip: Trip): string {
    const days = this.getDaysBetween(trip.startDate, trip.endDate);
    let html = '';
    
    for (let day = 1; day <= days; day++) {
      const date = new Date(trip.startDate);
      date.setDate(date.getDate() + day - 1);
      
      const dayActivities = trip.activities
        .filter(a => a.day === day)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      html += `
        <div class="day-section">
          <div class="day-header">
            <h3 style="margin: 0;">Day ${day} - ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          </div>
      `;
      
      if (dayActivities.length === 0) {
        html += '<p style="color: #6B7280; text-align: center; padding: 20px;">No activities planned for this day</p>';
      } else {
        dayActivities.forEach(activity => {
          html += `
            <div class="activity">
              <div class="activity-time">${activity.time}</div>
              <div class="activity-details">
                <div class="activity-title">${activity.title}</div>
                ${activity.location ? `<div class="activity-location">📍 ${activity.location}</div>` : ''}
                ${activity.notes ? `<div class="activity-notes">📝 ${activity.notes}</div>` : ''}
                <div class="activity-cost">💰 $${activity.cost}</div>
              </div>
            </div>
          `;
        });
      }
      
      html += '</div>';
    }
    
    return html;
  }

  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  // Download PDF
  downloadPDF(trip: Trip): void {
    const html = this.generatePDFItinerary(trip);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  // Share trip via Web Share API
  async shareTrip(trip: Trip): Promise<boolean> {
    if (!('share' in navigator)) {
      return false;
    }

    try {
      const shareData = {
        title: `${trip.name} - Trip to ${trip.destination}`,
        text: `Check out my trip to ${trip.destination} from ${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}!`,
        url: window.location.href
      };
      
      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
}

export const exportService = new ExportService();