// src/components/Achievements.js
import React from 'react';

const Achievement = ({ title, description, icon, date }) => (
  <div className="relative flex items-center space-x-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
      <span className="text-2xl">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      <span className="text-xs text-gray-400">
        Earned on {new Date(date).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const Achievements = ({ achievements }) => {
  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h2 className="text-lg font-medium text-gray-900 mb-4">{category}</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {categoryAchievements.map((achievement) => (
              <Achievement
                key={achievement.id}
                title={achievement.title}
                description={achievement.description}
                icon={achievement.icon}
                date={achievement.dateEarned}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Achievements;

// Example achievement data structure:
/*
{
  id: string,
  title: string,
  description: string,
  icon: string,
  category: string,
  dateEarned: timestamp,
  criteria: {
    type: string,
    value: number
  }
}
*/