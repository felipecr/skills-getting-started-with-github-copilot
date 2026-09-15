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
      activitySelect.innerHTML = '<option value="">-- Selecione uma atividade --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantList = details.participants.length
          ? details.participants
              .map(
                (participant) => `
                  <li class="participant-item">
                    <span class="participant-email">${participant}</span>
                    <button
                      type="button"
                      class="remove-participant-btn"
                      data-activity="${name}"
                      data-email="${participant}"
                      aria-label="Remove ${participant} from ${name}"
                      title="Remove participant"
                    >
                      🗑️
                    </button>
                  </li>
                `
              )
              .join("")
          : "<li class='participant-empty'>Nenhum participante ainda.</li>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="activity-description">${details.description}</p>
          <p class="activity-meta"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-meta"><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-box">
            <h5>Participantes</h5>
            <ul class="participants-list">
              ${participantList}
            </ul>
          </div>
        `;

        activityCard.querySelectorAll(".remove-participant-btn").forEach((button) => {
          button.addEventListener("click", async () => {
            const participantEmail = button.dataset.email;
            const activityName = button.dataset.activity;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participantEmail)}`,
                {
                  method: "DELETE",
                }
              );

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Unable to remove participant.");
              }

              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");

              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);

              fetchActivities();
            } catch (error) {
              messageDiv.textContent = error.message;
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });
        });

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
        await fetchActivities();
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
});
