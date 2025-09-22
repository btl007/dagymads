# 스케줄링 시스템 (`what_time`) 기술 명세서

## 1. 개요 (Overview)

이 문서는 '다짐 광고' SaaS의 촬영일 스케줄링 기능 구현을 위한 기술 명세를 정의합니다.

본 시스템은 **'미리 생성된 슬롯 (Pre-generated Slot)'** 모델을 기반으로 합니다. 이 모델은 구현의 단순성과 명확성에 중점을 두어, 개발 속도를 높이고 안정성을 확보하는 것을 목표로 합니다.

- **핵심 개념:** 1시간 단위의 모든 시간 슬롯을 데이터베이스에 미리 생성해두고, 각 슬롯의 상태를 변경하며 사용자와 관리자가 소통합니다.
- **시간 정책:** 시스템의 모든 시간 데이터는 애플리케이션 레벨에서 **한국 표준시(KST)를 기준**으로 처리합니다.

---

## 2. 데이터 모델 (Data Model)

### 2.1. `time_slots` 테이블 (신규 생성)

시스템의 중심이 되는 테이블로, 모든 시간 슬롯의 정보와 상태를 관리합니다.

| 컬럼명 | 타입 | 필수 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` (PK) | O | 고유 식별자 (Auto-increment) |
| `slot_time` | `timestampz` | O | 슬롯의 시작 시간 (타임존 포함, 예: `2025-10-23 14:00:00+09`) |
| `is_open` | `boolean` | O | **관리자가 오픈한 시간인지 여부.** `false`이면 어떤 사용자도 선택할 수 없음. (기본값: `true`) |
| `booking_status` | `text` | O | **슬롯의 예약 상태.** (기본값: `'available'`)<br>- `available`: 예약 가능<br>- `requested`: 센터가 예약 요청<br>- `confirmed`: 관리자가 예약 확정 |
| `project_id` | `bigint` (FK) | X | 이 슬롯을 점유(요청/확정)한 프로젝트의 ID. `projects.id`와 연결. |

### 2.2. 관련 테이블 (기존 테이블 활용)

- **`projects` 테이블:**
    - `shootdate` (`date`): 관리자가 특정 슬롯을 `confirmed` 상태로 변경할 때, 해당 슬롯의 날짜(`slot_time`)가 이 컬럼에 최종적으로 기록됩니다.
    - `status` (`text`): 스케줄링 워크플로우에 따라 상태가 변경됩니다. (예: `script_submitted` -> `schedule_requested` -> `schedule_confirmed`)

- **`user_profiles` 테이블:**
    - 역할(Role)은 Clerk JWT의 `public_metadata`에 포함된 `is_admin` (boolean) 값을 통해 관리됩니다. `is_admin`이 `true`가 아니면 모두 `center`로 간주하며, 이는 Supabase RLS(Row Level Security) 정책에 의해 제어됩니다. 별도의 `role` 컬럼은 사용하지 않습니다.

### 2.3. 테이블 관계 (Table Relationships)

- `time_slots.project_id`는 `projects.id`를 참조합니다. (One-to-Many: 하나의 프로젝트가 여러 개의 시간 슬롯을 `requested` 상태로 가질 수 있음)

---

## 3. 핵심 함수 및 로직 (Core Functions & Logic)

백엔드(Supabase Edge Function 등)에서 구현되어야 할 주요 함수들입니다.

#### `generateDailySlots()`
- **역할:** 관리자용 또는 Cron Job.
- **설명:** 매일 자정에 실행되어, 30일 뒤의 날짜에 해당하는 시간 슬롯(00:00 ~ 23:00 KST)을 `time_slots` 테이블에 미리 생성합니다.
- **입력:** `date` (생성할 날짜)
- **로직:** 해당 날짜의 24개 슬롯 레코드를 `time_slots`에 `INSERT`합니다.

#### `updateSlotAvailability(slot_ids, is_open)`
- **역할:** 관리자용.
- **설명:** 관리자가 특정 시간 슬롯들을 예약 불가능/가능 상태로 변경합니다.
- **입력:** `slot_ids` (배열), `is_open` (boolean)
- **로직:** `slot_ids`에 해당하는 모든 레코드의 `is_open` 값을 업데이트합니다.

#### `getAvailableSlots(start_date, end_date)`
- **역할:** 클라이언트(센터)용.
- **설명:** 사용자가 촬영을 요청할 날짜를 선택할 때, 예약 가능한 슬롯 목록을 반환합니다.
- **입력:** `start_date`, `end_date`
- **로직:** 주어진 기간 내에서 `is_open = true` 이고 `booking_status = 'available'` 인 모든 슬롯을 조회합니다.

#### `requestSlots(project_id, slot_ids)`
- **역할:** 클라이언트(센터)용.
- **설명:** 사용자가 원하는 시간 슬롯 예약을 요청합니다.
- **입력:** `project_id`, `slot_ids` (사용자가 선택한 슬롯 ID 배열)
- **로직:**
    1. `slot_ids`에 해당하는 슬롯들이 여전히 `available` 상태인지 확인합니다.
    2. 해당 슬롯들의 `booking_status`를 `'requested'`로, `project_id`를 입력된 `project_id`로 업데이트합니다.
    3. `projects` 테이블의 상태를 `'schedule_requested'`로 변경합니다.
    4. (트랜잭션으로 처리되어야 함)

#### `confirmShootDate(project_id, confirmed_slot_id)`
- **역할:** 관리자용.
- **설명:** 관리자가 사용자가 요청한 슬롯 중 하나를 최종 촬영일로 확정합니다.
- **입력:** `project_id`, `confirmed_slot_id` (확정할 슬롯 ID)
- **로직:**
    1. `confirmed_slot_id`에 해당하는 슬롯의 `booking_status`를 `'confirmed'`로 변경합니다.
    2. `projects` 테이블의 `shootdate` 컬럼을 해당 슬롯의 `slot_time` 값으로 업데이트하고, `status`를 `'schedule_confirmed'`로 변경합니다.
    3. 해당 `project_id`로 요청되었던 다른 모든 슬롯들(`booking_status = 'requested'`)을 다시 `'available'` 상태로 되돌리고 `project_id`를 `null`로 설정합니다.
    4. (트랜잭션으로 처리되어야 함)
    5. 관련 담당자들에게 알림을 생성합니다. (`notifications` 테이블 - 추후 구현)
