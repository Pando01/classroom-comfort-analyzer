
import React, { useState, useEffect } from 'react';
import { Thermometer, Sun, Wind, MapPin, Users, BarChart3, Settings, Star, AlertCircle } from 'lucide-react';

const ClassroomComfortAnalyzer = () => {
  const [currentView, setCurrentView] = useState('home');
  const [seatData, setSeatData] = useState({});
  const [airconditioners, setAirconditioners] = useState([
    { id: 1, x: 1, y: 0, status: 'on', startTime: '09:00' }, // 11번 좌석 위치 (x=1, y=0)
    { id: 2, x: 1, y: 4, status: 'on', startTime: '09:00' }  // 15번 좌석 위치 (x=1, y=4)
  ]);
  const [currentTime, setCurrentTime] = useState('10:00');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [lightSensorValue, setLightSensorValue] = useState('');
  const [temperatureRating, setTemperatureRating] = useState(3);
  const [comment, setComment] = useState('');

  // 교실 좌석 배치 (6x5 격자, 총 30개 좌석 - 세로로 배치)
  const CLASSROOM_ROWS = 5;
  const CLASSROOM_COLS = 6;
  
  // 좌석 번호를 x, y 좌표로 변환 (1~30, 세로로 배치)
  const getSeatPosition = (seatNumber) => {
    const x = Math.floor((seatNumber - 1) / CLASSROOM_ROWS);
    const y = (seatNumber - 1) % CLASSROOM_ROWS;
    return { x, y };
  };

  // x, y 좌표를 좌석 번호로 변환 (세로로 배치)
  const getSeatNumber = (x, y) => {
    return x * CLASSROOM_ROWS + y + 1;
  };

  const OPTIMAL_LIGHT = 500; // lux
  const OPTIMAL_TEMP = 3; // 5점 척도에서 3점 (보통)

  // 거리 계산 함수
  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // 에어컨 영향을 고려한 온도 조정
  const adjustTemperatureForAC = (seatX, seatY, measuredTemp) => {
    let adjustment = 0;
    airconditioners.forEach(ac => {
      if (ac.status === 'on') {
        const distance = calculateDistance(seatX, seatY, ac.x, ac.y);
        const k = 0.5; // 냉방 효과 계수
        const c = 1; // 최소 거리 보정
        adjustment += k / (distance + c);
      }
    });
    return measuredTemp - adjustment;
  };

  // 쾌적도 점수 계산
  const calculateComfortScore = (seatX, seatY, lightLevel, tempRating) => {
    const adjustedTemp = adjustTemperatureForAC(seatX, seatY, tempRating);
    const lightDiff = Math.abs(OPTIMAL_LIGHT - lightLevel) / OPTIMAL_LIGHT;
    const tempDiff = Math.abs(OPTIMAL_TEMP - adjustedTemp) / OPTIMAL_TEMP;
    
    const w1 = 0.4; // 조도 가중치
    const w2 = 0.6; // 온도 가중치
    
    const score = 100 - (w1 * lightDiff + w2 * tempDiff) * 100;
    return Math.max(0, Math.min(100, score));
  };

  // 데이터 저장
  const saveData = () => {
    if (!selectedSeat || !lightSensorValue) {
      alert('좌석과 조도 값을 모두 입력해주세요.');
      return;
    }

    const seatKey = `${selectedSeat.x}-${selectedSeat.y}`;
    const newData = {
      ...seatData,
      [seatKey]: {
        ...seatData[seatKey],
        [currentTime]: {
          light: parseFloat(lightSensorValue),
          temperature: temperatureRating,
          comment,
          timestamp: new Date().toISOString()
        }
      }
    };

    setSeatData(newData);
    setLightSensorValue('');
    setTemperatureRating(3);
    setComment('');
    setSelectedSeat(null);
    alert('데이터가 저장되었습니다!');
  };

  // 추천 좌석 계산
  const getRecommendedSeats = () => {
    const scores = [];
    
    for (let x = 0; x < CLASSROOM_COLS; x++) {
      for (let y = 0; y < CLASSROOM_ROWS; y++) {
        const seatKey = `${x}-${y}`;
        const seatInfo = seatData[seatKey];
        
        if (seatInfo && seatInfo[currentTime]) {
          const score = calculateComfortScore(
            x, y, 
            seatInfo[currentTime].light, 
            seatInfo[currentTime].temperature
          );
          scores.push({ x, y, score, data: seatInfo[currentTime] });
        }
      }
    }
    
    return scores.sort((a, b) => b.score - a.score);
  };

  // 좌석 색상 계산
  const getSeatColor = (x, y) => {
    const seatKey = `${x}-${y}`;
    const seatInfo = seatData[seatKey];
    
    if (!seatInfo || !seatInfo[currentTime]) {
      return 'bg-gray-200';
    }
    
    const score = calculateComfortScore(
      x, y, 
      seatInfo[currentTime].light, 
      seatInfo[currentTime].temperature
    );
    
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-400';
    if (score >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  // 조도 센서 시뮬레이션
  const simulateLightSensor = () => {
    const randomLight = Math.floor(Math.random() * 800) + 200;
    setLightSensorValue(randomLight.toString());
  };

  // 홈 화면
  const HomeView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">교실 쾌적도 분석 시스템</h1>
        <p className="text-gray-600">데이터 기반 최적 자리 추천 서비스</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setCurrentView('input')}
          className="p-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Users className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">데이터 입력</div>
          <div className="text-sm opacity-90">조도/온도 측정</div>
        </button>
        
        <button
          onClick={() => setCurrentView('analysis')}
          className="p-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">쾌적도 분석</div>
          <div className="text-sm opacity-90">히트맵 보기</div>
        </button>
        
        <button
          onClick={() => setCurrentView('recommend')}
          className="p-6 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Star className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">자리 추천</div>
          <div className="text-sm opacity-90">최적 좌석 찾기</div>
        </button>
        
        <button
          onClick={() => setCurrentView('admin')}
          className="p-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-8 h-8 mx-auto mb-2" />
          <div className="font-semibold">관리</div>
          <div className="text-sm opacity-90">에어컨 설정</div>
        </button>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">사용 방법</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>원하는 좌석에 앉아서 '데이터 입력'을 클릭</li>
          <li>스마트폰 조도 센서로 밝기를 측정하고 체감 온도를 평가</li>
          <li>'쾌적도 분석'에서 전체 교실 상황을 확인</li>
          <li>'자리 추천'에서 가장 쾌적한 자리를 찾으세요</li>
        </ol>
      </div>
    </div>
  );

  // 데이터 입력 화면
  const InputView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">데이터 입력</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          홈으로
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 시간대
          </label>
          <select
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            좌석 선택 (1-30번)
          </label>
          <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 rounded-lg">
            {Array.from({ length: CLASSROOM_ROWS }, (_, y) =>
              Array.from({ length: CLASSROOM_COLS }, (_, x) => {
                const seatNumber = getSeatNumber(x, y);
                const isAC = (seatNumber === 11 || seatNumber === 15);
                return (
                  <div key={`${x}-${y}`} className="relative">
                    <button
                      onClick={() => setSelectedSeat({ x, y, number: seatNumber })}
                      className={`w-12 h-12 rounded text-sm font-semibold ${
                        selectedSeat?.x === x && selectedSeat?.y === y
                          ? 'bg-blue-500 text-white'
                          : isAC 
                            ? 'bg-cyan-100 border-2 border-cyan-400 hover:bg-cyan-200'
                            : 'bg-white border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {seatNumber}
                    </button>
                    {isAC && (
                      <div className="absolute -top-2 -left-2">
                        <Wind className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {selectedSeat && (
            <p className="text-sm text-gray-600 mt-2">
              선택된 좌석: {selectedSeat.number}번
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Sun className="inline w-4 h-4 mr-1" />
            조도 측정 (lux)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={lightSensorValue}
              onChange={(e) => setLightSensorValue(e.target.value)}
              placeholder="조도 값 입력"
              className="flex-1 p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={simulateLightSensor}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              센서 시뮬레이션
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            스마트폰 조도 센서 앱을 사용하거나 시뮬레이션 버튼을 클릭하세요
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Thermometer className="inline w-4 h-4 mr-1" />
            체감 온도
          </label>
          <div className="flex justify-between items-center">
            <span className="text-blue-600">매우 춥다</span>
            <input
              type="range"
              min="1"
              max="5"
              value={temperatureRating}
              onChange={(e) => setTemperatureRating(parseInt(e.target.value))}
              className="flex-1 mx-4"
            />
            <span className="text-red-600">매우 덥다</span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-1">
            현재 선택: {['매우 춥다', '춥다', '보통', '덥다', '매우 덥다'][temperatureRating - 1]}
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            추가 코멘트 (선택사항)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="기타 의견이나 특이사항을 입력하세요"
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="3"
          />
        </div>
        
        <button
          onClick={saveData}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
        >
          데이터 저장
        </button>
      </div>
    </div>
  );

  // 분석 화면
  const AnalysisView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">쾌적도 분석</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          홈으로
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시간대 선택
          </label>
          <select
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
          </select>
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">교실 배치도 (쾌적도 히트맵)</h3>
          <div className="flex items-center gap-4 mb-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span>매우 쾌적 (80+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>쾌적 (60-79)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span>보통 (40-59)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span>불쾌 (40미만)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>데이터 없음</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 rounded-lg">
            {Array.from({ length: CLASSROOM_ROWS }, (_, y) =>
              Array.from({ length: CLASSROOM_COLS }, (_, x) => {
                const seatNumber = getSeatNumber(x, y);
                const isAC = (seatNumber === 11 || seatNumber === 15);
                return (
                  <div key={`${x}-${y}`} className="relative">
                    <div
                      className={`w-12 h-12 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${getSeatColor(x, y)}`}
                    >
                      {seatNumber}
                    </div>
                    {isAC && (
                      <div className="absolute -top-2 -left-2">
                        <div className={`p-1 rounded-full ${
                          airconditioners.find(ac => 
                            (ac.id === 1 && seatNumber === 11) || 
                            (ac.id === 2 && seatNumber === 15)
                          )?.status === 'on' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          <Wind className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <Wind className="inline w-4 h-4 mr-1" />
          파란색 아이콘: 가동 중인 에어컨 (11번, 15번 좌석)
        </div>
      </div>
    </div>
  );

  // 추천 화면
  const RecommendView = () => {
    const recommendations = getRecommendedSeats();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">자리 추천</h2>
          <button
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            홈으로
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시간대 선택
            </label>
            <select
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="12:00">12:00</option>
              <option value="13:00">13:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
            </select>
          </div>
          
          {recommendations.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-4">추천 자리 순위</h3>
              <div className="space-y-3">
                {recommendations.slice(0, 5).map((rec, index) => (
                  <div
                    key={`${rec.x}-${rec.y}`}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {getSeatNumber(rec.x, rec.y)}번 좌석
                          </div>
                          <div className="text-sm text-gray-600">
                            쾌적도 점수: {rec.score.toFixed(1)}점
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>조도: {rec.data.light} lux</div>
                        <div>체감온도: {['매우 춥다', '춥다', '보통', '덥다', '매우 덥다'][rec.data.temperature - 1]}</div>
                      </div>
                    </div>
                    {rec.data.comment && (
                      <div className="mt-2 text-sm text-gray-600">
                        💭 {rec.data.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>해당 시간대에 데이터가 없습니다.</p>
              <p className="text-sm">먼저 데이터를 입력해주세요.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 관리 화면
  const AdminView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">관리 페이지</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          홈으로
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="font-semibold mb-4">에어컨 관리</h3>
        <div className="space-y-4">
          {airconditioners.map(ac => (
            <div key={ac.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">에어컨 {ac.id}</div>
                <div className="text-sm text-gray-600">
                  위치: {ac.id === 1 ? '11번 좌석' : '15번 좌석'} | 가동 시작: {ac.startTime}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAirconditioners(prev => 
                      prev.map(a => 
                        a.id === ac.id 
                          ? { ...a, status: a.status === 'on' ? 'off' : 'on' }
                          : a
                      )
                    );
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    ac.status === 'on' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {ac.status === 'on' ? '가동중' : '정지'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="font-semibold mb-4">데이터 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(seatData).length}
              </div>
              <div className="text-sm text-blue-600">데이터 수집 좌석</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(seatData).reduce((total, seat) => 
                  total + Object.keys(seat).length, 0
                )}
              </div>
              <div className="text-sm text-green-600">총 측정 데이터</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    switch(currentView) {
      case 'input': return <InputView />;
      case 'analysis': return <AnalysisView />;
      case 'recommend': return <RecommendView />;
      case 'admin': return <AdminView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {renderView()}
      </div>
    </div>
  );
};

export default ClassroomComfortAnalyzer;