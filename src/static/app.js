document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list with delete icon
        let participantsHtml = '';
        if (details.participants.length > 0) {
          participantsHtml = '<ul class="participants-list" style="padding-left:0">';
          details.participants.forEach((email, idx) => {
            participantsHtml += `<li style="list-style-type:none;display:flex;align-items:center;justify-content:space-between;padding:4px 0;">`
              + `<span>${email}</span>`
              + `<span class="delete-icon" title="Unregister participant" style="cursor:pointer;margin-left:10px;" data-activity="${name}" data-index="${idx}">&#128465;</span>`
              + `</li>`;
          });
          participantsHtml += '</ul>';
        } else {
          participantsHtml = '<p class="no-participants">No participants yet.</p>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Delegate click event for delete icons
  document.getElementById('activities-list').addEventListener('click', async function(e) {
    if (e.target.classList.contains('delete-icon')) {
      const activity = e.target.getAttribute('data-activity');
      const idx = e.target.getAttribute('data-index');
      if (activity && idx !== null) {
        // Call backend to unregister participant
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?index=${idx}`, {
            method: 'POST',
          });
          if (response.ok) {
            fetchActivities(); // Refresh list
          } else {
            alert('Failed to unregister participant.');
          }
        } catch (err) {
          alert('Error unregistering participant.');
        }
      }
    }
  });
});
