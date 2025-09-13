import React from 'react'
import { Link } from 'react-router-dom';
import '../../tailwind.config.js'

import ToggleSection from '../components/ToggleSection.jsx';
import ToggleDrop from '../components/ToggleDrop.jsx';

import { ShimmerButton } from "@/components/magicui/shimmer-button";

import angle1 from '../img/angle1.png'
import angle2 from '../img/angle2.png'
import angle3 from '../img/angle3.png'
import youtube from '../img/youtube.png'
import dagym from '../img/dagym.jpg'
import thumb1 from '../img/thumb1.png'
import thumb2 from '../img/thumb2.png'
import thumb3 from '../img/thumb3.png'


export default function DagymGuide () {
    return (
        <section className="w-full justify-center mx-auto flex font-ibm text-gray-200 bg-[rgb(21,26,35)]">
            <div id="page-wrapper" className="w-full md:grid grid-cols-12 gap-2 px-5 md:px-16 mx-auto">
                <nav className="hidden md:block lg:block col-start-1 col-span-3 sticky h-max top-22">
                    <h3 className="py-6 text-left text-gray-400 text-xl font-bold">다짐 광고영상 가이드</h3>
                    <ul className="space-y-6 font-ibm text-base text-gray-400 font-semibold">
                        <li><a href="#notice" className="hover:text-white transition">유의 사항</a></li>
                        <li><a href="#shoot-info" className="hover:text-white transition">촬영 안내</a></li>
                        <li><a href="#script" className="hover:text-white transition">대본 작성하기</a></li>
                        <li><a href="#reference" className="hover:text-white transition">레퍼런스 영상</a></li>
                    </ul>
                </nav>

                <div id="notice" className="w-9/10 md:w-[700px] md:col-start-4 mx-auto mt-8">
                    <h2 className="text-left text-xl md:text-3xl font-semibold mb-4">✨ 다짐 광고영상 촬영 가이드 (필독)</h2>
                    <p className="text-left text-base leading-relaxed mt-2 mb-10">
                    사진 촬영과 <strong className="text-orange-400">"광고 영상 촬영"</strong>은 별개의 팀으로 움직이고 있습니다! 현재 문서는 “광고 촬영팀”이 진행합니다.<br /><br />
                    광고 영상 촬영은 ‘오디오’에 굉장히 민감합니다. 따라서, 회원님들이 최대한 없거나, 영업 마감 이후로 촬영 진행하고 있습니다.<br /><br />
                    모든 광고 영상의 내용(대본)은 센터별로 상이하며, 센터에서 대본을 사전에 작성하는 것을 기본으로 하되,<br />
                    촬영팀과 사전 또는 현장에서 조율하여 대본 작성이 가능합니다. 멘트 전체를 외우기 보다는 키워드 위주로 소구 포인트를 작성해주시면 더 좋은 영상이 만들어집니다.<br/>
                    </p>

                    <ToggleSection title="1. 24시간 운영 센터">
                        <p className="text-left text-base leading-relaxed mt-2 mb-10">
                        아래 3개의 옵션 중 선택하셔서 진행하시면 됩니다.<br /><br />
                        <span className="text-orange-400">
                        1. 회원님이 가장 안계신 시간대에 촬영 진행<br />
                        2. 부분 통제 또는 전체 통제 : 00시~ 00시까지 촬영진행으로 이용이 어렵습니다. 등의 공지<br />
                        3. 별도의 공간이 있을 경우 : 해당 공간에서 촬영 진행<br />
                        </span>
                        </p>
                    </ToggleSection>

                    <ToggleSection title="2. 영업 마감 후 촬영 가능 센터">
                        <p className="text-left text-base leading-relaxed mt-2 mb-2">
                        
                        <span className="text-orange-400">
                        1. 영업 마감 -1시간 전 : 인서트 촬영<br />
                        2. 영업 마감 후 : 광고 촬영<br />
                        <p className="ml-6">
                            <br />
                            예시) 영업 마감 23시 센터 <br /><br />
            
                            - 인서트 촬영 : 22시 시작<br />
                            - 인터뷰 촬영 : 23시 시작<br />
                        </p>
                        </span>
                        </p>
                    </ToggleSection>

                    <ToggleSection title="3. 영업 오픈 전 촬영 가능 센터">
                        <p className="text-left text-base leading-relaxed mt-2 mb-2">
                        
                        <span className="text-orange-400">
                        1. 영업 오픈 -1시간 30분 전 : 광고 촬영<br />
                        2. 영업 오픈 후 : 인서트 촬영<br />
                        <p className="ml-6">
                            <br />
                            예시) 영업 오픈 10시 센터 <br /><br />
            
                            - 광고 촬영 : 08시 30분 시작<br />
                            - 인서트 촬영 : 10시 시작<br />
                        </p>
                        </span>
                        </p>
                    </ToggleSection>

                    <ToggleSection title="4. 필라테스, 플라잉, 번지, 폴댄스, 요가 센터">
                        <p className="text-left text-base leading-relaxed mt-2 mb-2">
                        수업이 없는 시간대에 촬영 진행 가능합니다. 인터뷰 촬영을 위한 2시간 정도 확보해주세요.<br />
                        <span className="text-orange-400">
                        
                        <p className="ml-6">
                            <br />
                            예시) 14시 ~ 16시 수업이 없는 경우 <br /><br />
            
                            - 광고 촬영 : 14시 ~ 15시<br />
                            - 인서트 촬영 : 15시 ~ 16시<br />
                        </p>
                        </span>
                        </p>
                    </ToggleSection>

                    <ToggleSection title="5. 1:1 PT 센터">
                        <p className="text-left text-base leading-relaxed mt-2 mb-2">
                        수업이 없는 시간대에 인터뷰 촬영 진행 가능합니다. 인서트 촬영을 위해 회원님 또는 선생님 섭외가 필요합니다.<br />
                        <span className="text-orange-400">
                        
                        <p className="ml-6">
                            <br />
                            예시) 14시 ~ 15시 수업이 없는 경우 + 15시 ~ 16시 수업이 있는 경우 <br /><br />
            
                            - 광고 촬영 : 14시 ~ 15시<br />
                            - 인서트 촬영 : 15시 ~ 16시<br />
                            <br />
                            또는, 2번과 3번의 유형처럼 촬영 가능합니다.<br />
                        </p>
                        </span>
                        </p>
                    </ToggleSection>

                    {/* 2nd Paragraph */}

                    <h2 id="shoot-info" className="text-left text-xl md:text-3xl font-semibold mt-20 mb-4">🎥 촬영 안내</h2>
                    <p className="text-left text-base leading-relaxed mt-2 mb-10">
                    
                    </p>

                    <ToggleSection title="1. 멘트 촬영">
                        <p className="text-left text-base leading-relaxed mt-2 mb-2 mr-2">
                        
                        <span className="text-orange-400">
                        <p className="ml-6">
                            - 촬영 소요 시간 : 30분 내외 <br />
                            - 대본 : 예시 대본 참고<br />
                            - 구도 이미지 미리보기<br />                       
                        </p>
                        </span>
                        </p>

                        <img src={angle1} alt="angle1" className="justify-center mx-auto flex w-9/10 mb-2 rounded-lg"/>
                        <p className="text-center text-base leading-relaxed mb-4">전신이 다 나오는 앵글 (풀샷)</p>
                        <img src={angle2} alt="angle2" className="justify-center mx-auto flex w-9/10 mb-4 rounded-lg"/>
                        <p className="text-center text-base leading-relaxed mb-4">가슴까지 나오는 앵글 (바스트샷)</p>
                        <img src={angle3} alt="angle3" className="justify-center mx-auto flex w-9/10 mb-4 rounded-lg"/>
                        <p className="text-center text-base leading-relaxed mb-4">얼굴까지 나오는 앵글 (클로즈업)</p>
                    </ToggleSection>

                    <ToggleSection title="2. 인서트 촬영 (PT 지도하는 모습, 시설 전경)">
                        <p className="text-left text-base leading-relaxed mt-2 mb-2">
                        인서트 촬영은 영업 시간과 관계없이 촬영이 가능합니다! (회원님 유무 상관 없음) <br />
                        <span className="text-orange-400">
                        
                        <p className="ml-6">
                            
                            - 촬영 소요 시간 : PT 지도하는 모습 30분, 시설 전경 30분 <br />
                            - 선생님 최소 2분 이상 필요 (사전에 선생님들께 촬영 관련 고지 및 아래 내용 전달 부탁드립니다!)<br />
                            - 인서트 촬영 목록<br />
                            <br />
                        </p>
                        </span>
                        </p>
                    </ToggleSection>

                    <h2 id="script" className="text-left text-xl md:text-3xl font-semibold mt-20 mb-4">📓  대본 작성하기</h2>
                    <p className="text-left text-base leading-relaxed mt-2 mb-10">
                    광고 영상 대본은 센터의 장점과 담고 싶은 내용을 촬영하기 위해 센터에서 직접 작성합니다!<br />
                    대본은 A4 용지 2쪽 이내 분량이 적절하며, 작성하시는 데에 궁금한 점이나 애로사항이 있으시면 언제든지 촬영팀에게 문의해주세요!<br />
                    아래 예시 대본은 포맷화된 예시이며, 광고 영상을 만드는데 있어 참고해주시고 센터의 장점과 소구 포인트를 최대한 담아주세요!<br /><br />

                    담고 싶은 내용이 있으시다면! 꼭 말씀해주세요! 무조건 반영해드립니다!<br />
                    </p>

                    <h3 className="text-left text-lg md:text-2xl tracking-tighter md:tracking-normal font-semibold mt-4 mb-2">1. 일반 퍼블릭 헬스 센터 대본을 쓰기위한 문답</h3>
                    <ToggleDrop
                        items={[
                            { title: "기구", content: 
                                <div className="text-left">
                                    <ToggleSection title="Q. 유산소 존은 어떻게 구성되어 있을까요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. 유산소 존</strong>은 러닝머신 0대, 싸이클 0대, 스텝밀 0대, 마이마운틴 0대, 아크 트레이너 0대로 준비되어 있습니다. <br /><br /> 
                                        특히, <strong className="text-orange-500">스텝밀</strong>은 여성 회원님들의 둔근과 햄스트링을 자극할 수 있는 고강도 유산소 운동이 가능한 굉장히 좋은 머신입니다.<br /><br /> 
                                        특히, <strong className="text-orange-500">마이 마운틴</strong>은 경사도를 조절하여 시간당 칼로리 소모 효과를 극대화할 수 있는 유산소 머신입니다. <br /><br /> 
                                        특히, <strong className="text-orange-500">아크 트레이너</strong>는 발바닥, 발목, 고관절이 안 좋으신 회원님들도 쉽게 유산소 운동을 할 수 있는 머신입니다. <br />
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. 웨이트 머신 존은 어떻게 구성되어 있을까요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. 웨이트 머신 존</strong>은 00종의 머신들이 있고
                                        뉴텍, 디랙스, 싸이벡스, 해머 스트렝스, 라이프 피트니스, 아스널 스트렝스, 프리모션, 프리코, 포커스, 짐80으로 구비되어 있습니다.<br /><br /> 
                                        <strong className="text-orange-500">뉴텍</strong>은 초보자 회원님들도 쉽게 근육의 자극을 느낄 수 있고, 자세를 잡을 수 있고<br />
                                        <strong className="text-orange-500">뉴텍의 토크/토쳐 라인</strong>은 보다 직접적인 임팩트, 중량감을 느낄 수 있습니다.<br /><br />
                                        <strong className="text-orange-500">디랙스 퓨어 플레이트</strong>는 프리 웨이트의 묵직함과 기구의 안정성을 느낄 수 있으며<br /><br />
                                        <strong className="text-orange-500">해머 스트렝스</strong>는 서양인의 리치와 궤적, 가동범위를 느낄 수 있고, 원암씩 운동이 가능하여 좌우 비대칭 문제도 해결이 가능하며<br /><br />
                                        <strong className="text-orange-500">라이프 피트니스</strong>는 헬스 기구의 에르메스라 불리우는 명품 기구로써, 굉장히 부드럽고 사용하시면 이 기구가 왜 명품인지 아실 수 있습니다.<br /><br />
                                        <strong className="text-orange-500">아스널 스트렝스</strong>는 굉장히 중량감 있는 머신으로 타겟 부위에 강한 임팩트를 줄 수 있어서, 회원님들께서 보다 빠른 근성장 또는 운동의 재미와 흥미를 느낄 수 있습니다.<br /><br />
                                        상체 라인으로는 등, 가슴, 어깨, 팔, 복부, 허리를 운동할 수 있는 다양한 브랜드의 다양한 기구가 준비되어 있습니다. <br /><br />
                                        특히, 여성 회원님들께서 많이 찾으시는/좋아하시는/즐겨하시는 <strong className="text-orange-500">힙과 하체를 운동할 수 있는 머신으로는</strong> 힙 쓰러스트,
                                        레그 컬, 레그 프레스, 핵 프레스, 브이 스쿼트, 핵 스쿼트, 펜듈럼 스쿼트, 퍼펙트 스쿼트, 몬스터 글루트, 글루트, 이너/아웃 타이가 준비되어 있습니다.<br /><br />
                                        그렇기 때문에 회원님들께서 000에서 운동하시면 예쁜 힙/탄탄한 몸매/슬림한 라인/아름다운 뒷태를 쉽고 재밌게 만드실 수 있습니다.<br />
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. 프리 웨이트 존은 어떻게 구성되어 있을까요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. 프리 웨이트 존</strong>은 0대의 파워랙, 0대의 스미스 머신, 0대의 스쿼트 랙, 0대의 케이블 머신, 덤벨은 0kg 부터 0kg 까지 준비되어 있어
                                        회원님들께서 본인의 운동 수행 능력에 맞게 쾌적하게 운동할 수 있습니다.<br /><br /> 
                                        특히, <strong className="text-orange-500">파워랙의 우드 상판</strong>은 지면의 반발력을 통해서 보다 안정적인 자세로 프리 웨이트 운동을 할 수 있도록 준비했습니다.<br /><br />
                                        <strong className="text-orange-500">벤치</strong>는 플랫 벤치 0대, 인클라인 벤치, 디클라인 벤치 등 다양하게 구비되어 있고, <strong className="text-orange-500">3D 스미스 머신</strong>은 보다 안정적으로 스쿼트 운동을 할 수 있는 머신입니다.<br /><br />
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. 스트레칭 존은 어떻게 구성되어 있을까요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. 스트레칭 존</strong>은 독립적인 공간으로 구성되어 있으며, 운동 전/후로 폼 롤러를 이용한 근막 이완이나 부상 방지를 위한 스트레칭을 쾌적하게 이용할 수 있습니다.<br />
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. PT 존은 어떻게 구성되어 있을까요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. PT 존</strong>은 프라이빗한 공간에서 회원님께 보다 집중도 있고 밀도 있는 수업을 제공해드리기 위해 준비되어 있습니다.<br />
                                        </p>
                                    </ToggleSection>
                                </div>
                            },
                            { title: '수업', content: 
                                <div className="text-left">
                                    <ToggleSection title="Q. OT는 어떻게 진행되고 어떤 것을 알려주시나요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. 000의 OT</strong>는 운동을 처음 하시는 분, 초보이신 분들을 위해 인바디 체성분 측정, 체형 분석을 통해 객관적인 회원님의 현재 몸 상태와 운동의 방향성을 제공해드리고 있습니다.<br /><br />
                                        다양한 기구 사용 방법, 운동 자세 등을 친절하게 도와드리고 있습니다. 
                                        (다 회 제공 시) OT는 운동을 처음 하시는 분, 초보이신 분들을 위해 매 월 0회 제공해드리고 있습니다.<br /><br />
                                        000의 OT는 회원님께 우선 운동 목적을 여쭤봅니다. 다이어트, 체력 증진, 근육 증가, 체형 교정, 벌크업, 대회 준비 등 다양한 목적을 먼저 인지한 후 인바디 체성분 측정과 체형 측정을 통해 회원님의 현재 몸 상태를 객관적인 지표와 함께 분석해드립니다.<br />
                                        이후 운동의 방향성을 잡아드리고 단기 또는 중장기에 따른 운동 목적과 목표 또한 제안드립니다.<br /><br />
                                        전반적인 기구 사용법과 앞으로 운동함에 있어 어떠한 부분에 주안점을 가져가야하는지 또한 친절하게 안내해드립니다.
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. PT는 어떻게 진행되고 어떤 장점이 있나요?">
                                        <p className="text-left font-normal text-lg">
                                        <strong className="text-orange-500">A. 000의 PT</strong>는 다양한 대회 수상 경력, 생활체육지도사, 재활 등 다양한 자격을 보유하고 있는 선생님이
                                        항상 회원님들을 먼저 생각하며, 부담없이 친절하게 먼저 다가가 최선을 다해 지도해드리고 있습니다.<br /><br />
                                        다이어트, 벌크업, 체력 증가, 건강 증진, 바디 프로필, 대회 준비 등 회원님들의 다양한 목적에 맞춘 프로그램이 준비되어 있으며,<br /><br />
                                        밀도있고 깊이 있는 / 체계적인 커리큘럼과 직관적이며 친절한 수업을 통해
                                        회원님께서 보다 빠르게 / 안전하게 / 완벽하게 / 재밌게 / 다치지 않게 운동하도록 최선을 다하고 있습니다.<br /><br />
                                        000에서 운동하시면 회원님께서 원하시는 목표를 / 목적을 모두 이룰 수 있습니다.<br /><br />
                                        저희 PT는 안전을 최우선으로 생각합니다. 웨이트 운동을 지속적으로 수행하다보면 자연스레 중량이 증가하고 좋지 않은 자세, 습관 등이 고쳐지지 않는다면 필연적으로 부상이 찾아올 수 밖에 없습니다.<br />
                                        그렇기 때문에 하나의 동작을 수행하더라도 단순히 무게, 중량에 집착하기 보다 정확한 자세, 나의 체형과 밸런스에 맞는 무게를 익히면서 운동을 하실 수 있도록 가르쳐드리고 있습니다.<br /><br />
                                        저희 PT는 운동의 진정한 재미를 알려드립니다. 운동. 좋은 것 모두가 압니다. 그렇지만 왜 계속 하지 못하느냐? 결과를 내지 못하느냐? 재미를 느끼지 못해서입니다.<br />
                                        사실 운동은 정말 재미있습니다. 절대 힘들기만 한게 아닙니다. 저희는 회원님들과 함께 마치 내가 운동하는 것 마냥 재미있게 운동합니다. 과정이 재미있으면 결과 또한 좋기 마련입니다.<br /><br />
                                        </p>
                                    </ToggleSection>
                                </div>
                            },
                            { title: '시설', content: 
                                <div className="text-left">
                                    <ToggleSection title="24시간 운영 (지문 인식, 키오스크)">
                                        <p className="text-left font-normal text-lg">
                                        저희 센터는 <strong className="text-orange-500">24시간 운영</strong>되기 때문에 회원님들께서 언제든지 운동하실 수 있는 장점이 있습니다.
                                        또한, 지문 인식 / 키오스크를 통해서 쾌적하게 운동하실 수 있도록 준비되어 있습니다.
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="주차">
                                        <p className="text-left font-normal text-lg">
                                        저희 센터는 <strong className="text-orange-500">주차</strong>가 00대 가능하고, 0시간 무료 (전면 무료, 발렛 파킹)이기 때문에 편안하게 운동에 집중하실 수 있습니다.
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="반신욕기">
                                        <p className="text-left font-normal text-lg">
                                        저희 센터는 <strong className="text-orange-500">건식 반신욕기</strong>가 00대 있어서, 운동 전후로 워밍업이나 근육의 피로를 푸는데 도움을 드리고 있습니다. 
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="자판기 (바디 체리쉬)">
                                        <p className="text-left font-normal text-lg">
                                        저희 센터는 <strong className="text-orange-500">바디 체리쉬 </strong>자판기가 있어서 카페인 음료, 부스터, 닭가슴살 등 도움이 되는 식품을 센터에서 쉽게 구매할 수 있습니다.
                                        </p>
                                    </ToggleSection>
                                </div>
                            },
                            { title: '선생님', content: 
                                <div className="text-left">
                                    <ToggleSection title="Q. 선생님 경력은 어떻게 되나요?">
                                        <p className="text-left font-normal text-lg">
                                        저희 선생님은 <strong className="text-orange-500">기본 5년 이상 경력을 가진 </strong> 선생님들이 상주하시기 때문에 회원님들께 보다 전문적인 티칭이 가능합니다.<br />
                                        또한 체육학 전공, 생활체육지도사 자격증 등 필요한 자격증을 보유하고 있어 다양한 회원님의 케이스와 운동 목적에 맞는 운동을 티칭해드릴 수 있습니다.
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. 선생님들의 수상 이력이 있을까요?">
                                        <p className="text-left font-normal text-lg">
                                        저희 선생님은 <strong className="text-orange-500">피지크, 나바, 보디빌딩 대회 등 </strong> 다양한 대회의 수상 경력을 가지고 계십니다.<br />
                                        그렇기 때문에 누구보다 전문적이고 디테일한 수업이 가능하며, 끊임없이 운동에 대해 연구하고 회원님과 함께 발전해나가고 있습니다.
                                        </p>
                                    </ToggleSection>

                                    <ToggleSection title="Q. 선생님들의 마인드는 어떤가요?">
                                        <p className="text-left font-normal text-lg">
                                        저희 선생님은 <strong className="text-orange-500">회원님의 몸을 내몸 처럼 </strong> 생각합니다.<br />
                                        단순히 숫자만 세는 티칭이 아닌, 다양한 회원님의 가지고 계신 운동 수행능력과 목표 그리고 그 날의 컨디션에 맞추어 회원님께서 점진적 우상향으로 몸이 좋아질 수 있도록<br />
                                        목표를 이루실 수 있도록 최선을 다해서 운동을 지도해드리고 있습니다.
                                        </p>
                                    </ToggleSection>
                                </div>
                            },
                        ]}
                    />

                    {/*대본작성하기 버튼*/}
                    <div className="justify-center mx-auto flex mt-10">
                        <Link to="/editor">
                            <ShimmerButton shimmerColor="rgba(230,230,253,1)" background="rgba(70,70,230,1" hoverBackground="rgba(100,100,230,1)" >
                                <div className="mx-auto justify-cetner px-10 text-center text-white text-xl font-semibold">
                                    대본 작성하기
                                </div>
                            </ShimmerButton>
                        </Link>
                                               
                    </div>
                    

                    <h2 id="reference" className="text-left text-2xl md:text-3xl font-semibold mt-20 mb-4">📓  레퍼런스 (참고 영상)</h2>
                    <div className="mt-2 mb-6">
                        <a href="https://www.youtube.com/channel/UCi2F8t2EFPHzyNOd8TU5X0g/videos" target="_blank">
                            <div className="rounded-lg border-2 border-gray-900 hover:bg-gray-700 hover:border-gray-600 transition py-2 flex items-center h-[140px] overflow-hidden">
                                <div className="w-full md:w-7/10">
                                    <p className="text-left text-sm md:text-base leading-relaxed px-4 py-2">
                                        다짐 - 多Gym
                                    </p>
                                    <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 px-4 truncate">
                                        전국 1,000개 41개 종목의 운동시설을 한번에 알아보고 스마트하게 다니세요!<br />내 주변 운동시설 찾을 땐? 다짐(多Gym)! #운동할땐다짐부터
                                        </p>
                                    <div className="px-4 py-2 flex items-center">
                                        <img src={youtube}
                                            className="w-6 mr-2" />
                                        <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 truncate">
                                            https://www.youtube.com/channel/UCi2F8t2EFPHzyNOd8TU5X0g/videos
                                        </p>
                                    </div>
                                </div>
                                <div className="w-0 md:w-3/10">
                                    <img src={dagym} className="w-full object-center rounded-lg" />
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="mb-6">
                        <a href="https://www.youtube.com/watch?v=-EcG2ZQTIOI" target="_blank">
                            <div className="rounded-lg border-2 border-gray-900 hover:bg-gray-700 hover:border-gray-600 transition py-2 flex items-center h-[140px] overflow-hidden">
                                <div className="w-full md:w-7/10">
                                    <p className="text-left text-sm md:text-base leading-relaxed px-4 py-2 truncate">
                                        "목표 달성까지 책임지고 도와드리겠습니다." 인계 일론짐...
                                    </p>
                                    <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 px-4 truncate">
                                    "운동부터 식단까지, 스스로 운동하실 수 있도록 돕겠습니다."<br />
                                    일론짐 대표님의 운영철학을 영상으로 확인하세요.🫶
                                        </p>
                                    <div className="px-4 py-2 flex items-center">
                                        <img src={youtube}
                                            className="w-6 mr-2" />
                                        <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 truncate">
                                        https://www.youtube.com/watch?v=-EcG2ZQTIOI
                                        </p>
                                    </div>
                                </div>
                                <div className="w-0 md:w-3/10">
                                    <img src={thumb1} className="max-w-[270px] object-center rounded-lg" />
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="mb-6">
                        <a href="https://www.youtube.com/watch?v=tzUkshxSnDk" target="_blank">
                            <div className="rounded-lg border-2 border-gray-900 hover:bg-gray-700 hover:border-gray-600 transition py-2 flex items-center h-[140px] overflow-hidden">
                                <div className="w-full md:w-7/10">
                                    <p className="text-left text-base leading-relaxed px-4 py-2 truncate">
                                        탄방동에서 헬스장 찾으신다면, "헬스보이짐 탄방점"을 추천드립니다.
                                    </p>
                                    <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 px-4 truncate">
                                        회원들의 만족도가 높아서 유명한 헬스장!<br />
                                        헬스보이짐 탄방점에서 쾌적하게 운동해보세요.😊
                                        </p>
                                    <div className="px-4 py-2 flex items-center">
                                        <img src={youtube}
                                            className="w-6 mr-2" />
                                        <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 truncate">
                                        https://www.youtube.com/watch?v=tzUkshxSnDk
                                        </p>
                                    </div>
                                </div>
                                <div className="w-0 md:w-3/10">
                                    <img src={thumb2} className="max-w-[250px] rounded-lg" />
                                </div>
                            </div>
                        </a>
                    </div>
                
                    <div className="mb-6">
                        <a href="https://www.youtube.com/watch?v=Yuor8MRKVvs" target="_blank">
                            <div className="rounded-lg border-2 border-gray-900 hover:bg-gray-700 hover:border-gray-600 transition py-2 flex items-center h-[140px] overflow-hidden">
                                <div className="w-full md:w-7/10">
                                    <p className="text-left text-base leading-relaxed px-4 py-2 truncate">
                                        "재미가 없다면 운동은 포기하게 됩니다." 역삼 하와이짐...
                                    </p>
                                    <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 px-4 truncate">
                                        저도 삼겹살에 소주 좋아합니다.😊 <br />
                                        삶과 균형된 운동, 제가 꼭 알려드리겠습니다!
                                        </p>
                                    <div className="px-4 py-2 flex items-center">
                                        <img src={youtube}
                                            className="w-6 mr-2" />
                                        <p className="text-left text-xs md:text-sm leading-relaxed text-gray-400 truncate">
                                        https://www.youtube.com/watch?v=Yuor8MRKVvs
                                        </p>
                                    </div>
                                </div>
                                <div className="w-0 md:w-3/10">
                                    <img src={thumb3} className="max-w-[260px] rounded-lg" />
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="mb-10" />
                </div>
            </div>
            
        </section>
    );
}

