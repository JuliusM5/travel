import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNCalendarEvents from 'react-native-calendar-events';
import { Trip, Activity } from '../types';
import { formatDate } from '../utils/formatters';

class ExportService {
  async exportToCalendar(trip: Trip) {
    try {
      // Request calendar permission
      const authStatus = await RNCalendarEvents.requestPermissions();
      if (authStatus !== 'authorized') {
        Alert.alert('Permission Denied', 'Calendar access is required to export trips.');
        return;
      }

      // Create main trip event
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      endDate.setDate(endDate.getDate() + 1); // Make it inclusive

      const eventConfig = {
        title: `✈️ ${trip.name}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: trip.destination,
        notes: `Trip to ${trip.destination}\nBudget: $${trip.budget}`,
        allDay: true,
      };

      const eventId = await RNCalendarEvents.saveEvent(eventConfig.title, eventConfig);

      // Add activities as separate events
      for (const activity of trip.activities) {
        const activityDate = new Date(trip.startDate);
        activityDate.setDate(activityDate.getDate() + activity.day - 1);
        
        const [hours, minutes] = activity.time.split(':');
        activityDate.setHours(parseInt(hours), parseInt(minutes));
        
        const activityEndDate = new Date(activityDate);
        activityEndDate.setHours(activityEndDate.getHours() + 2); // 2 hour duration

        await RNCalendarEvents.saveEvent(activity.title, {
          startDate: activityDate.toISOString(),
          endDate: activityEndDate.toISOString(),
          location: activity.location || trip.destination,
          notes: `${activity.notes || ''}\nCost: $${activity.cost}`,
        });
      }

      Alert.alert('Success', `Trip "${trip.name}" has been added to your calendar!`);
    } catch (error) {
      console.error('Calendar export failed:', error);
      Alert.alert('Export Failed', 'Unable to export to calendar. Please try again.');
    }
  }

  async exportToPDF(trip: Trip) {
    try {
      // Generate HTML content
      const html = this.generateTripHTML(trip);
      
      // Create file path
      const fileName = `${trip.name.replace(/\s+/g, '-').toLowerCase()}-itinerary.html`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      // Write HTML file
      await RNFS.writeFile(filePath, html, 'utf8');
      
      // Share the file
      await Share.open({
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        type: 'text/html',
        title: `${trip.name} Itinerary`,
        message: `Here's the itinerary for ${trip.name}`,
        filename: fileName,
      });
      
      // Clean up the file after sharing
      setTimeout(() => {
        RNFS.unlink(filePath).catch(() => {});
      }, 5000);
    } catch (error) {
      if (error !== 'User did not share') {
        console.error('PDF export failed:', error);
        Alert.alert('Export Failed', 'Unable to export trip. Please try again.');
      }
    }
  }

  private generateTripHTML(trip: Trip): string {
    const days = this.getDaysBetween(trip.startDate, trip.endDate);
    
    let activitiesHTML = '';
    for (let day = 1; day <= days; day++) {
      const date = new Date(trip.startDate);
      date.setDate(date.getDate() + day - 1);
      
      const dayActivities = trip.activities
        .filter(a => a.day === day)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      activitiesHTML += `
        <div class="day-section">
          <h3>Day ${day} - ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
      `;
      
      if (dayActivities.length === 0) {
        activitiesHTML += '<p class="no-activities">No activities planned</p>';
      } else {
        dayActivities.forEach(activity => {
          activitiesHTML += `
            <div class="activity">
              <div class="activity-time">${activity.time}</div>
              <div class="activity-details">
                <strong>${activity.title}</strong>
                ${activity.location ? `<br>📍 ${activity.location}` : ''}
                ${activity.notes ? `<br>📝 ${activity.notes}` : ''}
                <br>💰 $${activity.cost}
              </div>
            </div>
          `;
        });
      }
      
      activitiesHTML += '</div>';
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${trip.name} - Itinerary</title>
        <style>
          body {
            font-family: -apple-system, system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
          }
          h1