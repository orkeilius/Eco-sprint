export interface Objective {
  id: string;
  name: string;
  lat: number;
  lon: number;
  pointValue: number;
  completed: boolean;
}

interface ObjectiveListProps {
  objectives: Objective[];
  onObjectiveSelect?: (objective: Objective) => void;
}

const ObjectiveList = ({ objectives, onObjectiveSelect }: ObjectiveListProps) => {
  const completedObjectives = objectives.filter(obj => obj.completed);
  const pendingObjectives = objectives.filter(obj => !obj.completed);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700">Pending Objectives ({pendingObjectives.length})</h3>
      <ul className="space-y-2">
        {pendingObjectives.map((objective) => (
          <li 
            key={objective.id}
            className="p-2 bg-green-50 rounded-md flex justify-between items-center cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => onObjectiveSelect?.(objective)}
          >
            <span className="font-medium">{objective.name}</span>
            <span className="text-green-600 font-bold">+{objective.pointValue}</span>
          </li>
        ))}
      </ul>
      
      {completedObjectives.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-700 mt-6">Completed ({completedObjectives.length})</h3>
          <ul className="space-y-2">
            {completedObjectives.map((objective) => (
              <li 
                key={objective.id}
                className="p-2 bg-gray-100 rounded-md flex justify-between items-center text-gray-500"
              >
                <span className="line-through">{objective.name}</span>
                <span className="text-gray-400">+{objective.pointValue}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default ObjectiveList;
